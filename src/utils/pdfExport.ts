import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts any CSS color string containing oklch(...) to an RGB or RGBA string
 * using HTML Canvas 2D context.
 */
export function parseCssColorToRgb(colorStr: string): string {
  if (!colorStr || !colorStr.includes('oklch')) return colorStr;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#333333';
    ctx.fillStyle = '#000000';
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a < 255) {
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#333333';
  }
}

/**
 * Sanitizes a cloned DOM tree by converting all oklch() color functions
 * in style tags, inline styles, and computed properties to standard rgb()/rgba() colors.
 */
export function sanitizeDomForHtml2Canvas(clonedDoc: Document, clonedElement: HTMLElement) {
  // 1. Replace oklch in all <style> tags in clonedDoc
  const styles = clonedDoc.querySelectorAll('style');
  styles.forEach((style) => {
    if (style.textContent && style.textContent.includes('oklch')) {
      style.textContent = style.textContent.replace(/oklch\([^)]+\)/gi, (match) => {
        return parseCssColorToRgb(match);
      });
    }
  });

  // 2. Convert inline styles and computed color properties on clonedElement & children
  const allClonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll<HTMLElement>('*'))];
  allClonedElements.forEach((el) => {
    if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
      el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/gi, (match) => {
        return parseCssColorToRgb(match);
      });
    }

    if (clonedDoc.defaultView) {
      try {
        const computed = clonedDoc.defaultView.getComputedStyle(el);
        const colorProps = [
          'color',
          'backgroundColor',
          'borderColor',
          'borderTopColor',
          'borderBottomColor',
          'borderLeftColor',
          'borderRightColor',
          'fill',
          'stroke',
          'outlineColor'
        ];
        colorProps.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && val.includes('oklch')) {
            el.style.setProperty(prop, parseCssColorToRgb(val));
          }
        });
      } catch {
        // non-blocking
      }
    }
  });
}

/**
 * Captures an HTML element as an A4 PDF document safely without oklch color errors
 * and without clipping/truncating the document into half page.
 */
export async function exportElementToA4Pdf(
  element: HTMLElement,
  filename: string,
  scale: number = 2.2
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    onclone: (clonedDoc, clonedElement) => {
      // Force exact standard A4 width (794px = 210mm at 96 DPI)
      clonedElement.style.width = '794px';
      clonedElement.style.minWidth = '794px';
      clonedElement.style.maxWidth = '794px';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '28px';
      clonedElement.style.transform = 'none';

      if (clonedElement.parentElement) {
        clonedElement.parentElement.style.width = '794px';
        clonedElement.parentElement.style.minWidth = '794px';
        clonedElement.parentElement.style.maxWidth = '794px';
        clonedElement.parentElement.style.margin = '0 auto';
        clonedElement.parentElement.style.padding = '0';
        clonedElement.parentElement.style.overflow = 'visible';
      }

      sanitizeDomForHtml2Canvas(clonedDoc, clonedElement);
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeightMm <= pdfPageHeight + 1) {
    // Fits on 1 page!
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm);
  } else {
    // Multi-page slicing!
    let heightLeft = imgHeightMm;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMm);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 5) {
      position -= pdfPageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMm);
      heightLeft -= pdfPageHeight;
    }
  }

  pdf.save(filename);
}
