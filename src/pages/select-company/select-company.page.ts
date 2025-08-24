import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { CategoryModel } from 'src/models/category-model';
import { StoreModel } from 'src/models/store-model';
import { FavoriteService } from 'src/services/favorite.service';
import { SelectCompanyService } from 'src/services/select-company.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-select-company',
  templateUrl: './select-company.page.html',
  styleUrls: ['./select-company.page.scss'],
})
export class SelectCompanyPage implements OnInit {
  constructor(
    private router: Router,
    private service: SelectCompanyService,
    private navCtrl: NavController,
    private session: SessionService,
    private favoriteService: FavoriteService
  ) { }

  isLoading = false;
   filtersExpanded: boolean = false;
  isEmptyResult = false;
  searching = false;
  categories: CategoryModel[] = [];
  companies: StoreModel[] = [];
  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedFilter: 'minorQueue' | 'favorites' | 'recent' | 'nearby' | null = null;

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadData();
  }

  private loadData() {
    this.loadCategories();
    this.loadStores();
  }

  loadCategories() {
    this.service.loadCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
      }
    });
  }

  loadStores() {
    this.loadFilteredStores();
  }

  private loadFilteredStores(categoryId?: number, quickFilter?: string) {
    this.isLoading = true;
    this.isEmptyResult = false;

    const user = this.session.getUser();
    const userId = user?.id;

    this.service.loadFilteredStores(categoryId, quickFilter, userId).subscribe({
      next: (response) => {
        this.companies = response.data.map(store => ({
          ...store,
          isNew: this.checkIfNew(store.createdAt),
          liked: store.liked || false,
          minorQueue: store.minorQueue || false,
          // Adicionando propriedade de distância se disponível
          distance: store.distance || this.calculateRandomDistance()
        } as StoreModel));

        this.isEmptyResult = this.companies.length === 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar lojas:', err);
        this.isLoading = false;
        this.isEmptyResult = true;
      }
    });
  }

  // Novo método para calcular distância aleatória (apenas para demonstração)
  private calculateRandomDistance(): number {
    return Math.round((Math.random() * 10 + 0.5) * 10) / 10;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadFilteredStores();
    } finally {
      event.target.complete();
    }
  }

  private checkIfNew(createdAt: string): boolean {
    try {
      const createdDate = new Date(createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch (e) {
      console.warn('Erro ao verificar data:', e);
      return false;
    }
  }

  get filteredCards() {
    const query = this.searchQuery.toLowerCase();
    return this.companies.filter(card =>
      card.name.toLowerCase().includes(query) ||
      card.category?.toLowerCase().includes(query)
    );
  }

  toggleSearch() {
    this.searching = !this.searching;
    if (!this.searching) {
      this.searchQuery = '';
      // Recarregar a lista completa ao fechar a busca
      this.loadFilteredStores();
    }
  }

  toggleLike(card: StoreModel, event: MouseEvent): void {
    event.stopPropagation();

    const user = this.session.getUser();
    if (!user || !user.id) {
      this.showLoginAlert();
      return;
    }

    const heart = event.target as HTMLElement;
    heart.classList.add('heart-animation');

    const previousLikeState = card.liked;

    card.liked = !card.liked;

    const likeOperation = card.liked
      ? this.favoriteService.likeStore(card.id, user.id)
      : this.favoriteService.dislikeStore(card.id, user.id);

    likeOperation.subscribe({
      next: (response) => {
        if (!response.valid) {
          card.liked = previousLikeState;
          this.showErrorToast('Ocorreu um erro ao processar sua ação');
        }
      },
      error: (err) => {
        card.liked = previousLikeState;
        console.error('Erro ao atualizar like:', err);
        this.showErrorToast('Falha na conexão. Tente novamente.');
      },
      complete: () => {
        setTimeout(() => {
          if (heart.classList.contains('heart-animation')) {
            heart.classList.remove('heart-animation');
          }
        }, 500);
      }
    });
  }

  private showLoginAlert(): void {
    console.warn('Usuário não logado. Redirecionar para login.');
    // Você pode implementar um alerta ou redirecionamento para login aqui
  }

  private showErrorToast(message: string): void {
    console.error(message);
    // Você pode implementar um toast de erro aqui
  }

  selectCard(card: StoreModel): void {
    this.router.navigate(['/select-professional'], {
      queryParams: { storeId: card.id }
    });
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value;
    // Não é necessário filtrar manualmente pois usamos getter filteredCards
  }

  selectCategory(idCategory: number): void {
    if (this.selectedCategoryId === idCategory) {
      this.selectedCategoryId = null;
      this.loadFilteredStores();
      return;
    }

    this.selectedCategoryId = idCategory;
    this.loadFilteredStores(idCategory);
  }

  getBack() {
    this.navCtrl.back();
  }

  applyFilter(filter: 'minorQueue' | 'favorites' | 'recent' | 'nearby') {
    if (this.selectedFilter === filter) {
      this.selectedFilter = null;
      this.loadFilteredStores();
      return;
    }

    this.selectedFilter = filter;
    let quickFilter: string;

    switch (filter) {
      case 'minorQueue':
        quickFilter = 'minorQueue';
        break;
      case 'favorites':
        quickFilter = 'favorites';
        break;
      case 'recent':
        quickFilter = 'recent';
        break;
      case 'nearby':
        quickFilter = 'nearby';
        break;
      default:
        quickFilter = '';
    }

    const categoryId = this.selectedCategoryId !== null ? this.selectedCategoryId : undefined;
    this.loadFilteredStores(categoryId, quickFilter);
  }




  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  hasActiveFilters(): boolean {
    return !!this.selectedFilter || !!this.selectedCategoryId || !!this.searchQuery;
  }

  clearFilters() {
    this.selectedFilter = null;
    this.selectedCategoryId = null;
    this.searchQuery = '';
    this.applyFilter( 'nearby');
  }
}