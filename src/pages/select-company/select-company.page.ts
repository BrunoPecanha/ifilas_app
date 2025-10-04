import { Component, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild('filtersScroll') filtersScroll: any;

  canScrollRight = true;
  isLoading = false;
  filtersExpanded: boolean = false;
  isEmptyResult = false;
  searching = false;
  categories: CategoryModel[] = [];
  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedFilter: 'minorQueue' | 'favorites' | 'recent' | 'nearby' | null = null;

  loadingMore = false;
  currentPage = 1;
  pageSize = 10;
  hasMoreData = true;

  displayedCompanies: StoreModel[] = [];

  categoriesExpanded: boolean = false;

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.resetPagination();
    this.loadData();
  }

  private resetPagination() {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.displayedCompanies = [];
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

  private loadStores() {
    const user = this.session.getUser();
    const userId = user?.id;

    if (!userId) {
      console.warn('Usuário não logado');
      this.displayedCompanies = [];
      this.isEmptyResult = true;
      return;
    }

    this.loadFilteredStores(userId);
  }

  private loadFilteredStores(userId: number) {
    this.isLoading = true;
    this.isEmptyResult = false;

    const categoryId = this.selectedCategoryId ?? undefined;
    const quickFilter = this.selectedFilter ?? undefined;

    this.service.loadFilteredStores(userId, categoryId, quickFilter, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.handleStoresResponse(response);
      },
      error: (err) => {
        console.error('Erro ao carregar lojas filtradas:', err);
        this.handleLoadError();
      }
    });
  }

  private handleStoresResponse(response: any) {
    const newStores = response.data.items.map((store: StoreModel) => ({
      ...store,
      isNew: this.checkIfNew(store.createdAt),
      liked: store.liked || false,
      minorQueue: store.minorQueue || false,
      distance: store.distance || this.calculateRandomDistance()
    } as StoreModel));

    if (this.currentPage === 1) {
      this.displayedCompanies = newStores;
    } else {
      this.displayedCompanies = [...this.displayedCompanies, ...newStores];
    }

    const totalCount = response.data.totalCount ?? (this.displayedCompanies.length);
    this.hasMoreData = this.displayedCompanies.length < totalCount;

    this.isEmptyResult = this.displayedCompanies.length === 0;
    this.isLoading = false;
    this.loadingMore = false;
  }

  private handleLoadError() {
    this.displayedCompanies = [];
    this.isLoading = false;
    this.loadingMore = false;
    this.isEmptyResult = true;
    this.hasMoreData = false;
  }

  private calculateRandomDistance(): number {
    return Math.round((Math.random() * 10 + 0.5) * 10) / 10;
  }

  async handleRefresh(event: any) {
    this.resetPagination();
    try {
      await this.loadStores();
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
    if (!this.searchQuery) {
      return this.displayedCompanies;
    } else {
      const query = this.searchQuery.toLowerCase();
      return this.displayedCompanies.filter(card =>
        card.name.toLowerCase().includes(query) ||
        card.category?.toLowerCase().includes(query)
      );
    }
  }

  toggleSearch() {
    this.searching = !this.searching;
    if (!this.searching) {
      this.searchQuery = '';
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
  }

  private showErrorToast(message: string): void {
    console.error(message);
  }

  selectCard(card: StoreModel): void {
    this.router.navigate(['/select-professional'], {
      queryParams: { storeId: card.id }
    });
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value;
  }

  getBack() {
    this.navCtrl.back();
  }

  toggleCategories() {
    this.categoriesExpanded = !this.categoriesExpanded;
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
    this.categoriesExpanded = false;
    this.resetPagination();
    this.loadStores();
  }

  checkScrollPosition() {
    const element = this.filtersScroll.nativeElement;
    this.canScrollRight = element.scrollWidth > element.clientWidth + element.scrollLeft;
  }

  async onContentScroll(event: any) {
    const scrollElement = await event.target.getScrollElement();
    const scrollHeight = scrollElement.scrollHeight;
    const scrollTop = scrollElement.scrollTop;
    const clientHeight = scrollElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight * 0.8 &&
      this.hasMoreData &&
      !this.loadingMore &&
      !this.isLoading) {
      this.loadMoreData();
    }
  }

  private loadMoreData() {
    this.loadingMore = true;
    this.currentPage++;

    const user = this.session.getUser();
    const userId = user?.id;

    if (!userId) {
      this.loadingMore = false;
      return;
    }

    const categoryId = this.selectedCategoryId ?? undefined;
    const quickFilter = this.selectedFilter ?? undefined;

    this.service.loadFilteredStores(userId, categoryId, quickFilter, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.handleStoresResponse(response);
      },
      error: (err) => {
        console.error('Erro ao carregar mais lojas filtradas:', err);
        this.loadingMore = false;
        this.currentPage--;
      }
    });
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFilter) count++;
    if (this.selectedCategoryId) count++;
    if (this.searchQuery) count++;
    return count;
  }

  applyFilter(filter: 'minorQueue' | 'favorites' | 'recent' | 'nearby') {
    if (this.selectedFilter === filter) {
      this.selectedFilter = null;
    } else {
      this.selectedFilter = filter;
    }

    this.resetPagination();
    this.loadStores();

    setTimeout(() => {
      this.filtersExpanded = false;
    }, 300);
  }

  selectCategory(idCategory: number): void {
    if (this.selectedCategoryId === idCategory) {
      this.selectedCategoryId = null;
    } else {
      this.selectedCategoryId = idCategory;
    }

    this.resetPagination();
    this.loadStores();

    setTimeout(() => {
      this.filtersExpanded = false;
    }, 300);
  }
}