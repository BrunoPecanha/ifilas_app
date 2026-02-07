import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ServiceModel } from 'src/models/service-model';
import { StoreModel } from 'src/models/store-model';
import { FavoriteService } from 'src/services/favorite.service';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';
import { StoresService } from 'src/services/stores.service';
import { ToastService } from 'src/services/toast.service';

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
  liked: boolean = false;
  canAccess: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private storeService: StoresService,
    private serviceService: ServiceService,
    private navCtrl: NavController,
    private session: SessionService,
    private favoriteService: FavoriteService,
    private toastService: ToastService
  ) {
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.storeId = id ? parseInt(id, 10) : null;

    if (this.storeId !== null && !isNaN(this.storeId)) {
      this.loadData().then(() => this.checkLiked());
    } else {
      console.error('Loja não encontrada');
      this.isLoading = false;
    }
  }

  async loadData() {
    await Promise.all([
      this.loadStore(),
      this.loadServices(),
      this.loadProducts(),
      this.loadGallery()
    ]);
    this.isLoading = false;
  }

  checkLiked() {
    const user = this.session.getUser();
    if (!this.storeId || !user?.id)
      return;

    this.favoriteService.likedStore(this.storeId, user.id)
      .subscribe({
        next: (response) => {
          this.liked = response.data;
        },
        error: (err) => console.error('Erro ao buscar like', err)
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
            url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyRLiNRrAezLc8omVTVVMQhM_i-z0o-2T1YQ&s',
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

  get whatsappLink(): string {
    const message = 'Olá, vim do seu perfil no iFilas. Gostaria de saber mais sobre seus serviços.';
    return `https://wa.me/55${this.store.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  toggleLike(store: StoreModel, event: MouseEvent): void {
    event.stopPropagation();

    const heart = event.target as HTMLElement;
    const user = this.session.getUser();

    const previousLikeState = this.liked;

    this.liked = !this.liked;
    store.votes += this.liked ? 1 : -1;

    if (this.liked) {
      heart.classList.add('heart-animation');
    }

    const likeOperation = this.liked
      ? this.favoriteService.likeStore(store.id, user.id)
      : this.favoriteService.dislikeStore(store.id, user.id);

    likeOperation.subscribe({
      next: (response) => {
        if (!response.valid) {
          this.liked = previousLikeState;
          store.votes += this.liked ? 1 : -1;
          this.toastService.show('Erro ao processar sua ação.', 'danger');
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar like:', err);
        this.liked = previousLikeState;
        store.votes += this.liked ? 1 : -1;
        this.toastService.show('Falha na conexão. Tente novamente.', 'danger');
      },
      complete: () => {
        setTimeout(() => {
          heart.classList.remove('heart-animation');
        }, 500);
      },
    });
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

  showComingSoon() {
    this.toastService.show('Em breve disponível');
  }
}