import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { createAnimation, NavController } from '@ionic/angular';
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';

@Component({
  selector: 'app-onboarding',
  templateUrl: './on-boarding.page.html',
  styleUrls: ['./on-boarding.page.scss'],
})
export class OnboardingPage implements AfterViewInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  currentIndex = 0;
  private swiper: Swiper | undefined;

  fadeSlideTransition = (baseEl: any) => {
    const enteringEl = baseEl.querySelector(':scope > .ion-page');
    const leavingEl = baseEl.querySelector(':scope > .ion-page:not(.ion-page-hidden)');

    const enteringAnimation = createAnimation()
      .addElement(enteringEl)
      .fromTo('opacity', '0', '1')
      .fromTo('transform', 'translateY(20px)', 'translateY(0px)')
      .fromTo('transform', 'translateY(20px) scale(0.98)', 'translateY(0) scale(1)')

    const leavingAnimation = createAnimation()
      .addElement(leavingEl)
      .fromTo('opacity', '1', '0.3');

    return createAnimation()
      .duration(350)
      .easing('ease-out')
      .addAnimation([enteringAnimation, leavingAnimation]);
  };

  constructor(private navCtrl: NavController) { }

  ngAfterViewInit() {
    this.swiper = new Swiper(this.swiperContainer.nativeElement, {
      modules: [Pagination],
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      on: {
        slideChange: () => {
          this.currentIndex = this.swiper?.activeIndex || 0;
        }
      }
    });
  }

  next() {
    this.swiper?.slideNext();
  }

  skip() {
    this.completeOnboarding();
  }

  start() {
    this.completeOnboarding();
  }

  private completeOnboarding() {
    localStorage.setItem('hasSeenOnboarding', 'true');

    setTimeout(() => {
      this.navCtrl.navigateForward('/login', {
        animation: this.fadeSlideTransition
      });
    }, 100);
  }
}