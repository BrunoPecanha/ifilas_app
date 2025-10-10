import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ServiceModel } from 'src/models/service-model';
import { StoreModel } from 'src/models/store-model';
import { ServiceService } from 'src/services/services.service';
import { StoresService } from 'src/services/stores.service';

@Component({
  selector: 'app-store-details',
  templateUrl: './store-details.page.html',
  styleUrls: ['./store-details.page.scss'],
})
export class StoreDetailsPage implements OnInit {
  storeId: number | null = null;
  store: StoreModel = {} as StoreModel;
  services: ServiceModel[] = [];
  products: any[] = [];
  galleryImages: any[] = [];
  isInfoModalOpen: boolean = false;
  isLoading: boolean = true;
  selectedTab: string = 'services';

  constructor(
    private route: ActivatedRoute,
    private storeService: StoresService,
    private serviceService: ServiceService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.storeId = id ? parseInt(id, 10) : null;

    if (this.storeId !== null && !isNaN(this.storeId)) {
      this.loadData();
    } else {
      console.error('Loja não encontrada');
      this.isLoading = false;
    }
  }

  loadData() {
    Promise.all([
      this.loadStore(),
      this.loadServices(),
      this.loadProducts(),
      this.loadGallery()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadStore(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storeService.getStoreById(this.storeId!).subscribe({
        next: (response) => {
          this.store = response.data;
          resolve();
        },
        error: (err) => {
          console.error('Erro ao carregar loja:', err);
          reject(err);
        }
      });
    });
  }

  loadServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serviceService.loadServicesByStore(this.storeId!, true).subscribe({
        next: (response) => {
          this.services = response.data;
          resolve();
        },
        error: (err) => {
          console.error('Erro ao carregar serviços do estabelecimento:', err);
          reject(err);
        }
      });
    });
  }

  loadProducts(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.products = [
          {
            id: 1,
            name: 'Shampoo Profissional',
            description: 'Shampoo para cabelos tratados com proteína de seda',
            price: 45.90,
            originalPrice: 52.90,
            image: null,
            rating: 4.8,
            stock: 15,
            isNew: true
          },
          {
            id: 2,
            name: 'Pomada Modeladora',
            description: 'Fixação média com brilho natural e hidratação',
            price: 32.50,
            image: null,
            rating: 4.6,
            stock: 8
          }
        ];
        resolve();
      }, 500);
    });
  }

  loadGallery(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.galleryImages = [
          {
            url: 'assets/images/gallery/salon-1.jpg',
            caption: 'Nosso ambiente principal'
          },
          {
            url: 'assets/images/gallery/service-1.jpg',
            caption: 'Corte moderno'
          }
        ];
        resolve();
      }, 500);
    });
  }

  getBack() {
    this.navCtrl.back();
  }

  getStore(id: number) {
    this.storeService.getStoreById(id).subscribe({
      next: (response) => {
        this.store = response.data;
      },
      error: (err) => {
        console.error('Erro ao carregar loja:', err);
      }
    });
  }

  openInfoModal() {
    this.isInfoModalOpen = true;
  }

  hasSocialMedia(): boolean {
    return !!(
      this.store.instagram ||
      this.store.facebook ||
      this.store.whatsapp ||
      this.store.youtube
    );
  }

  getItemsCountText(): string {
    switch (this.selectedTab) {
      case 'services':
        return `${this.services.length} serviço${this.services.length !== 1 ? 's' : ''}`;
      case 'products':
        return `${this.products.length} produto${this.products.length !== 1 ? 's' : ''}`;
      case 'gallery':
        return `${this.galleryImages.length} foto${this.galleryImages.length !== 1 ? 's' : ''}`;
      default:
        return '';
    }
  }

  toggleLike(store: any) {
    if (!store.likesCount) store.likesCount = 0;
    store.liked = !store.liked;

    if (store.liked) {
      store.likesCount++;
    } else {
      store.likesCount--;
    }

    // this.apiService.toggleLike(store.id, store.liked).subscribe(...)
  }

  getServiceDuration(service: ServiceModel): string {
    return '30 min';
  }

  getServiceCategory(service: ServiceModel): string {
    return 'Cabelo';
  }

  getWeekDayName(weekDay: string): string {
    const days: { [key: string]: string } = {
      'sunday': 'Dom',
      'monday': 'Seg',
      'tuesday': 'Ter',
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb'
    };
    return days[weekDay.toLowerCase()] || weekDay;
  }

  getStars(count: number): number[] {
    return Array(count).fill(0).map((_, i) => i + 1);
  }

  getStarIcon(star: number, rating: number): string {
    return star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline';
  }

  selectService(service: ServiceModel) {
    console.log('Serviço selecionado:', service);
  }

  openGallery(index: number) {
    console.log('Abrir galeria no índice:', index);
  }
}