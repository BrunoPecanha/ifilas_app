import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
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

  categories: CategoryModel[] = [];
  searchQuery = '';
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

  constructor(
    private router: Router,
    private service: SelectCompanyService,
    private navCtrl: NavController,
    private session: SessionService,
    private favoriteService: FavoriteService
  ) { }

  ngOnInit() {
    this.startAutoScroll();
  }

  ionViewWillEnter() {
    this.resetPagination();
    this.loadData();
  }


  private loadData() {
    this.loadCategories();
    this.loadStores();
  }

  ngOnDestroy() {
    this.stopAutoScroll();
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

    if (searchValue.trim() !== '') {
      this.contentHidden = true;
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

    return 'Sem ninguém na frente';
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
    return `${user?.address}, ${user?.number}` || 'Endereço não definido';
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

  banners = [
    {
      id: 1,
      title: 'Evite filas',
      image: 'assets/images/banner/banner_promo.jpg',
      action: 'about'
    },
    {
      id: 2,
      title: 'Favoritos',
      image: 'assets/images/banner/banner_promo2.png',
      action: 'favorites'
    },
    {
      id: 3,
      title: 'Chegue na hora certa',
      image: 'assets/images/banner/banner_promo3.jpg',
      action: 'how-it-works'
    }
  ];

  onBannerClick(banner: any) {
    switch (banner.action) {
      case 'about':
        break;
      case 'favorites':
        break;
    }
  }

  onBannerScroll() {
    const scrollElement = this.bannersScroll.nativeElement;
    const scrollLeft = scrollElement.scrollLeft;
    const bannerWidth = scrollElement.clientWidth; 

    this.activeBannerIndex = Math.round(scrollLeft / bannerWidth);
  }

  goToBanner(index: number) {
    this.activeBannerIndex = index;
    const scrollElement = this.bannersScroll.nativeElement;
    const bannerWidth = scrollElement.clientWidth;

    scrollElement.scrollTo({
      left: index * bannerWidth,
      behavior: 'smooth'
    });
  }

  startAutoScroll() {
    this.autoScrollInterval = setInterval(() => {
      const nextIndex = (this.activeBannerIndex + 1) % this.banners.length;
      this.goToBanner(nextIndex);
    }, 6000);
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  pauseAutoScroll() {
    this.stopAutoScroll();
    setTimeout(() => this.startAutoScroll(), 10000);
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
    if (this.isScrolling)
      return;

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

    if (!this.searchQuery || this.searchQuery.trim() === '') {
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
      (!this.searchQuery || this.searchQuery.trim() === '');
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
}