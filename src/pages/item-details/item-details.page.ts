import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ServiceModel } from 'src/models/service-model';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-details.page.html',
  styleUrls: ['./item-details.page.scss'],
})
export class ItemDetailsPage implements OnInit {
  @ViewChild(IonContent) content: IonContent | null = null;

  service: ServiceModel | null = null;
  serviceId: number = 0;
  storeId: number = 0;
  useAgenda: boolean = false;
  currentQuantity: number = 0;
  headerScrolled: boolean = false;
  quantity = 0;
  professionalName: string = '';

  selectedServices: ServiceModel[] = [];

  constructor(
    private router: Router,
    private serviceService: ServiceService,
    private sessionService: SessionService
  ) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state || history.state;

    if (state?.service) {
      this.service = state.service;
      this.storeId = state.storeId;
      this.useAgenda = state.useAgenda || false;
      this.professionalName = state.professionalName || '';
    }
  }

  ionViewWillEnter() {
    this.loadSelectedServicesFromSession();
    this.checkCurrentQuantity();
  }

  confirmSelection() {
    if (!this.service)
      return;

    const index = this.selectedServices.findIndex(s => s.id === this.service?.id);

    if (this.quantity === 0) {
      if (index >= 0) {
        this.selectedServices.splice(index, 1);
      }
    }
    else {
      if (index >= 0) {
        this.selectedServices[index].quantity = this.quantity;
      }
      else {
        this.selectedServices.push({
          ...this.service,
          quantity: this.quantity
        } as ServiceModel);
      }
    }

    this.sessionService.setGenericKey(this.selectedServices, 'selectedServices');

    this.router.navigate(['/select-services'], {
      queryParams: {
        storeId: this.storeId,
        useAgenda: this.useAgenda,
        professionalName: this.professionalName
      }
    });
  }

  loadServiceDetails() {
    this.serviceService.loadServiceById(this.serviceId).subscribe({
      next: (response) => {
        this.service = response.data[0];
        this.checkCurrentQuantity();
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes do serviço:', err);
      }
    });
  }

  add() {
    this.quantity = 1;
  }

  increment() {
    this.quantity++;
  }

  decrement() {
    if (this.quantity > 0) {
      this.quantity--;
    }
  }

  loadSelectedServicesFromSession() {    
    const savedServices = this.sessionService.getGenericKey('selectedServices');
    if (savedServices) {
      this.selectedServices = savedServices;
    }
  }

  checkCurrentQuantity() {
    if (this.service && this.selectedServices.length > 0) {
      const found = this.selectedServices.find(s => s.id === this.service?.id);
      this.currentQuantity = found ? (found.quantity || 0) : 0;
    } else {
      this.currentQuantity = 0;
    }

    this.quantity = this.currentQuantity;
  }

  getFormattedPrice(): string {
    if (!this.service) return 'R$ 0,00';

    if (this.service.variablePrice) {
      return 'A combinar';
    }

    return `R$ ${(this.service.price || 0).toFixed(2).replace('.', ',')}`;
  }

  getFormattedTime(): string {
    if (!this.service) 
      return '0 min';

    const duration = this.service.duration || 0;
    return `${duration} min`;
  }

  getTotalPriceWithQuantity(): string {
    if (!this.service)
      return 'R$ 0,00';

    if (this.service.variablePrice) {
      return 'A combinar';
    }

    const total = (this.service.price || 0) * this.currentQuantity;
    return `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  incrementQuantity(event: Event) {
    event.stopPropagation();
    this.currentQuantity++;
  }

  decrementQuantity(event: Event) {
    event.stopPropagation();
    if (this.currentQuantity > 0) {
      this.currentQuantity--;
    }
  }

  addToSelection(event: Event) {
    event.stopPropagation();
    this.currentQuantity = 1;
  }

  goBack() {
    this.saveSelection();
    this.router.navigate(['/select-services'], {
      queryParams: { storeId: this.storeId, useAgenda: this.useAgenda, professionalName: this.professionalName }
    });
  }

  saveSelection() {
    if (!this.service)
      return;

    const index = this.selectedServices.findIndex(s => s.id === this.service?.id);

    if (this.currentQuantity === 0) {
      if (index >= 0) {
        this.selectedServices.splice(index, 1);
      }
    } else {
      if (index >= 0) {
        this.selectedServices[index].quantity = this.currentQuantity;
      } else {
        this.selectedServices.push({
          ...this.service,
          quantity: this.currentQuantity
        } as ServiceModel);
      }
    }

    this.sessionService.setGenericKey(this.selectedServices, 'selectedServices');
  }

  onScroll(event: any) {
    this.headerScrolled = event.detail.scrollTop > 10;
  }
}