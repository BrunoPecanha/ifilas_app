import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
export class SelectCompanyPage implements OnInit, OnDestroy {

  @ViewChild('filtersScroll') filtersScroll: any;
  @ViewChild('searchInput', { read: ElementRef }) searchInput!: ElementRef;
  @ViewChild('bannersScroll') bannersScroll!: ElementRef;

  canScrollRight = true;
  isLoading = false;
  filtersExpanded = false;
  isEmptyResult = false;
  searching = false;
  categoriesExpanded = false;

  searchQuery: string = '';
  private searchTimeout: any;


  categories: CategoryModel[] = [];
  selectedCategoryId: number | null = null;
  selectedFilter: 'minorQueue' | 'favorites' | 'recent' | 'nearby' | null = null;
  favoriteStores: StoreModel[] = [];
  displayedCompanies: StoreModel[] = [];

  loadingMore = false;
  currentPage = 1;
  pageSize = 10;
  hasMoreData = true;

  headerHidden = false;
  contentHidden = false;
  lastScrollTop = 0;
  private isScrolling = false;
  activeBannerIndex = 0;
  autoScrollInterval: any;
  private autoScrollPaused = false;

  constructor(
    private router: Router,
    private service: SelectCompanyService,
    private navCtrl: NavController,
    private session: SessionService,
    private favoriteService: FavoriteService
  ) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.resetPagination();
    this.loadData();
    this.startAutoScroll();
  }

  ngOnDestroy() {
    this.stopAutoScroll();
  }

  private loadData() {
    this.loadCategories();
    this.loadStores();
  }

  private loadStores() {
    const user = this.session.getUser();
    const userId = user?.id;

    if (!userId) {
      console.warn('Usuário não logado');
      this.displayedCompanies = [];
      this.favoriteStores = [];
      this.isEmptyResult = true;
      return;
    }

    this.loadFilteredStores(userId);
    this.loadFavoriteStores(userId);
  }

  private loadCategories() {
    this.service.loadCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
      }
    });
  }


  banners = [
    {
      id: 3,
      title: 'Destaque sua loja',
      subtitle: 'Apareça primeiro para clientes próximos',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    },
    {
      id: 4,
      title: 'Quer mais clientes?',
      subtitle: 'Destaque sua loja e aumente seus atendimentos',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    },
    {
      id: 5,
      title: 'Fique na frente da concorrência',
      subtitle: 'Sua loja em evidência para quem está por perto',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    },
    {
      id: 6,
      title: 'Mais visibilidade, mais movimento',
      subtitle: 'Destaque sua loja e lota sua agenda',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    },
    {
      id: 7,
      title: 'Bora lotar essa agenda?',
      subtitle: 'Coloque sua loja em destaque aqui no app',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    },
    {
      id: 8,
      title: 'Sua loja bombando 🔥',
      subtitle: 'Apareça pra quem tá pronto pra ser atendido',
      cta: 'Em breve',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    }
  ];

  private loadFilteredStores(userId: number) {
    this.isLoading = true;
    this.isEmptyResult = false;

    const categoryId = this.selectedCategoryId ?? undefined;

    const quickFilter = this.searchQuery?.trim()
      ? this.searchQuery.trim()
      : this.selectedFilter ?? undefined;

    this.service.loadFilteredStores(
      userId,
      categoryId,
      quickFilter,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.handleStoresResponse(response);
      },
      error: (err) => {
        console.error('Erro ao carregar lojas filtradas:', err);
        this.handleLoadError();
      }
    });
  }

  trackById(index: number, item: CategoryModel) {
    return item.id;
  }

  private loadFavoriteStores(userId: number) {
    this.service.getAllLikedStoresByUserId(userId).subscribe({
      next: (response) => {
        this.favoriteStores = response.data.map((store: StoreModel) => ({
          ...store,
          isNew: this.checkIfNew(store.createdAt),
          liked: true,
          isOpen: store.isOpen,
          minorQueue: store.minorQueue || false,
          distance: store.distance || this.calculateRandomDistance()
        } as StoreModel));
      },
      error: (err) => {
        console.error('Erro ao carregar lojas favoritadas:', err);
        this.favoriteStores = [];
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

  get filteredCards() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.displayedCompanies;
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      return this.displayedCompanies.filter(card =>
        card.name?.toLowerCase().includes(query) ||
        card.category?.toLowerCase().includes(query)
      );
    }
  }

  get shouldShowContent(): boolean {
    return (!this.searchQuery || this.searchQuery.trim() === '') && !this.contentHidden;
  }

  onSearch(event: any) {
    const searchValue = event.detail?.value || event.target?.value || '';
    this.searchQuery = searchValue;

    if (this.searchQuery.trim() !== '') {
      this.contentHidden = true;
    } else {
      this.contentHidden = false;
    }
  }

  toggleSearch() {
    this.searching = !this.searching;
    if (!this.searching) {
      this.searchQuery = '';
      this.contentHidden = false;
    } else {
      setTimeout(() => {
        if (this.searchInput && this.searchInput.nativeElement) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  hasQueue(card: any): boolean {
    return card.useQueue === true;
  }

  hasAgenda(card: any): boolean {
    return card.useAgenda === true;
  }

  getQueueText(card: any): string {
    if (!this.hasQueue(card)) {
      return 'Sem filas abertas';
    }

    if (card.minorQueue > 0) {
      return `${card.minorQueue} pessoa(s) na frente`;
    }

    return 'Nenhuma pessoa na fila';
  }

  getQueueTimeText(card: any): string | null {
    return card.timeForNextOnQueue
      ? `${card.timeForNextOnQueue} de espera`
      : 'Sua vez agora';
  }

  getAgendaText(card: any): string {
    return card.nextHourOnAgenda ?? '';
  }

  clearFilters() {
    this.selectedFilter = null;
    this.selectedCategoryId = null;
    this.searchQuery = '';
    this.categoriesExpanded = false;
    this.resetPagination();
    this.loadStores();

    this.contentHidden = false;
    this.headerHidden = false;
  }

  getUserAddress() {
    const user = this.session.getUser();
    return `${user?.address}` || 'Endereço não definido';
  }

  hasActiveFilters(): boolean {
    return !!this.selectedFilter || !!this.selectedCategoryId || !!this.searchQuery;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFilter) count++;
    if (this.selectedCategoryId) count++;
    if (this.searchQuery) count++;
    return count;
  }

  onBannerClick(banner: any) {
    switch (banner.action) {
      case 'about':
        break;
      case 'favorites':
        this.viewAllFavorites();
        break;
      case 'how-it-works':
        break;
    }
  }

  onBannerScroll() {
    if (!this.bannersScroll) return;
    const scrollElement = this.bannersScroll.nativeElement;
    const scrollLeft = scrollElement.scrollLeft;
    const cardWidth = scrollElement.clientWidth - 48;
    const newIndex = Math.round(scrollLeft / (cardWidth + 12));
    if (newIndex !== this.activeBannerIndex && newIndex >= 0 && newIndex < this.banners.length) {
      this.activeBannerIndex = newIndex;
    }
  }

  goToBanner(index: number) {
    if (!this.bannersScroll || index < 0 || index >= this.banners.length) return;
    const scrollElement = this.bannersScroll.nativeElement;
    const cardWidth = scrollElement.clientWidth - 48;
    scrollElement.scrollTo({
      left: index * (cardWidth + 12),
      behavior: 'smooth'
    });
    this.activeBannerIndex = index;
    this.resetAutoScrollTimer();
  }

  startAutoScroll() {
    if (this.banners.length <= 1) return;
    this.stopAutoScroll();
    this.autoScrollInterval = setInterval(() => {
      if (this.autoScrollPaused) return;
      const nextIndex = (this.activeBannerIndex + 1) % this.banners.length;
      this.goToBanner(nextIndex);
    }, 4000);
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  pauseAutoScroll() {
    this.autoScrollPaused = true;
  }

  resumeAutoScroll() {
    this.autoScrollPaused = false;
    this.resetAutoScrollTimer();
  }

  private resetAutoScrollTimer() {
    this.stopAutoScroll();
    this.startAutoScroll();
  }


  openFilters() {
    this.toggleFilters();
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

  async onContentScroll(event: any) {
    if (this.isScrolling) return;

    this.isScrolling = true;

    const scrollElement = await event.target.getScrollElement();
    const scrollTop = scrollElement.scrollTop;
    const clientHeight = scrollElement.clientHeight;
    const scrollHeight = scrollElement.scrollHeight;

    if (scrollTop + clientHeight >= scrollHeight * 0.8 &&
      this.hasMoreData &&
      !this.loadingMore &&
      !this.isLoading) {
      this.loadMoreData();
    }

    if (!this.searching) {
      const isScrollingDown = scrollTop > this.lastScrollTop;
      const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);

      const hideThreshold = 400;
      const showThreshold = 100;

      if (scrollDelta > 5) {
        if (isScrollingDown && scrollTop > hideThreshold && !this.contentHidden) {
          this.contentHidden = true;
        } else if (!isScrollingDown && scrollTop <= showThreshold && this.contentHidden) {
          this.contentHidden = false;
        }
      }

      if (scrollTop === 0 && this.contentHidden) {
        this.contentHidden = false;
      }
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

    setTimeout(() => {
      this.isScrolling = false;
    }, 150);
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

  async handleRefresh(event: any) {
    this.resetPagination();
    try {
      await this.loadStores();
    } finally {
      event.target.complete();
      this.contentHidden = false;
      this.headerHidden = false;
    }
  }

  selectCard(card: StoreModel): void {
    this.router.navigate(['/select-professional'], {
      queryParams: { storeId: card.id }
    });
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

  viewAllFavorites() {
    this.selectedFilter = 'favorites';
    this.resetPagination();
    this.loadStores();

    setTimeout(() => {
      const content = document.querySelector('ion-content');
      if (content) {
        content.scrollToTop(500);
      }
    }, 100);
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

  openExplore() {
    this.router.navigate(['/explore']);
  }

  checkScrollPosition() {
    const element = this.filtersScroll.nativeElement;
    this.canScrollRight = element.scrollWidth > element.clientWidth + element.scrollLeft;
  }

  private resetPagination() {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.displayedCompanies = [];
  }

  private calculateRandomDistance(): number {
    return Math.round((Math.random() * 10 + 0.5) * 10) / 10;
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

  private showLoginAlert(): void {
    console.warn('Usuário não logado. Redirecionar para login.');
  }

  private showErrorToast(message: string): void {
    console.error(message);
  }

  get shouldShowFavorites(): boolean {
    return this.favoriteStores.length > 0 &&
      (!this.searchQuery || this.searchQuery.trim() === '') &&
      !this.searching;
  }

  goToNotifications() {
    try {
      this.navCtrl.navigateForward('/notification');
    } catch (err) {
      console.error('Navigation error to notifications:', err);
      this.router.navigate(['/notification']);
    }
  }

  showContent() {
    this.contentHidden = false;
    this.headerHidden = false;
  }

  hideContent() {
    this.contentHidden = true;
  }

  openSearch() {
    this.searching = true;
    this.contentHidden = false;

    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  closeSearch() {
    this.searching = false;
    this.searchQuery = '';
    this.contentHidden = false;

    this.resetPagination();
    this.loadStores();
  }

  changeAddress() {
    console.log('Abrir alteração de endereço');
  }

  clearSearch() {
    this.searchQuery = '';
    this.contentHidden = false;
    this.resetPagination();
    this.loadStores();
  }

  onSearchChange() {
    const query = this.searchQuery.trim();
    clearTimeout(this.searchTimeout);

    if (!query) {
      this.resetSearch();

      this.resetPagination();
      this.loadStores();

      return;
    }

    if (query.length < 2) {
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.resetPagination();
      this.loadStores();
    }, 300);
  }

  resetSearch() {
    this.searching = false;
    this.contentHidden = false;

    this.selectedCategoryId = null;
  }
}