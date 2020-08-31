import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

export type DynamicWidthDirectiveParams = {
  minWidth: number;
  maxWidth: number;
};

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[dynamicWidth]',
})
export class DynamicWidthDirective implements OnInit, OnDestroy {
  private unsubscribe: any;
  private element: HTMLInputElement | HTMLTextAreaElement;

  @Input('dynamicWidth') params: DynamicWidthDirectiveParams;

  constructor(readonly renderer: Renderer2, readonly elementRef: ElementRef) {}

  ngOnInit() {
    const element = this.elementRef.nativeElement as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === 'input' || tag === 'textarea') {
      this.element = element as HTMLInputElement | HTMLTextAreaElement;
      this.unsubscribe = this.renderer.listen(
        this.elementRef.nativeElement,
        'keyup',
        () => {
          this.adjustWidth();
        }
      );

      setTimeout(() => {
        this.adjustWidth();
      }, 10);
    }
  }

  ngOnDestroy() {
    if (!this.unsubscribe) {
      return;
    }
    this.unsubscribe();
  }

  // Public metoda pro "manualni" prepočet šířky, když se změní model. Input sám o změně bohužel neví
  // Programátor na to musí pamatovat :(
  triggerRecalculate() {
    setTimeout(() => {
      this.adjustWidth();
    });
  }

  private adjustWidth() {
    const { minWidth, maxWidth } = this.params;

    if (!minWidth || !maxWidth) {
      return;
    }

    const fakeElement = document.createElement('span');
    fakeElement.textContent = this.element.value;
    // Firefox has annonying behaviour. It does not know the "shortcut properties" like 'font' or 'padding'
    // You have to type the full property name.
    const styleProps = [
      'font-size',
      'font-family',
      'letter-spacing',
      'line-height',
      'padding-left',
      'padding-height',
    ];
    const style = getComputedStyle(this.elementRef.nativeElement);
    styleProps.forEach((prop) => {
      fakeElement.style[prop] = style[prop];
    });

    // get width
    fakeElement.style.visibility = 'hidden';
    document.body.append(fakeElement);
    let width = fakeElement.offsetWidth;
    fakeElement.remove();

    if (width > maxWidth) {
      width = maxWidth - 15;
    }

    if (width > minWidth && width <= maxWidth) {
      // 26px is "buffer", so that the text-ellipsis is not shown.
      // It used to be 18px. It seems that Chrome has changed behaviour of input boxes.
      this.element.style.width = `${width + 26}px`;
    }
  }
}
