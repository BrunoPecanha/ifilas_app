import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { EmployeeStoreService } from 'src/services/employee.store.service';
import { QueueService } from 'src/services/queue.service';
import { SessionService } from 'src/services/session.service';
import { StoresService } from 'src/services/stores.service';

@Component({
  selector: 'app-choose-establishment',
  templateUrl: './choose-establishment.page.html',
  styleUrls: ['./choose-establishment.page.scss'],
})
export class ChooseEstablishmentPage implements OnInit {
  @ViewChild(IonContent) ionContent!: IonContent;

  selectedHeaderImage: any = '';
  selectedLogo: any = '';
  user: UserModel | any;
  profileSelected: number = 1;
  establishments: StoreModel[] = [];
  filteredEstablishments: StoreModel[] = [];
  isLoading = false;
  loadingCompanyId: number | null = null;

  searchTerm: string = '';
  categories: string[] = [];
  selectedCategory: string = '';
  showScrollIndicator: boolean = true;

  private categoryColors: { [key: string]: string } = {
    'Lanchonete': '#ef4444',
    'Barbearia': '#3b82f6',
    'Restaurante': '#f59e0b',
    'Salão de Beleza': '#8b5cf6',
    'Oficina': '#10b981',
    'Consultório': '#06b6d4',
    'Loja': '#f97316',
    'Supermercado': '#84cc16',
    'Farmácia': '#ec4899',
    'Academia': '#6366f1'
  };

  constructor(
    private router: Router,
    private storeService: StoresService,
    private employeeStoreService: EmployeeStoreService,
    private session: SessionService,
    private navCtrl: NavController,
    private queueService: QueueService
  ) { }

  ngOnInit(): void {
    this.loadEstablishments();
  }

  loadEstablishments() {
    this.isLoading = true;
    this.user = this.session.getUser();
    this.profileSelected = this.session.getProfile();

    if (this.user && this.profileSelected) {
      this.storeService.loadEmployeeStores(this.user.id, this.profileSelected).subscribe({
        next: (response) => {
          this.establishments = response.data || [];
          this.filteredEstablishments = [...this.establishments];
          this.extractCategories();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar estabelecimentos:', err);
          this.isLoading = false;
        }
      });
    } else {
      console.error('Usuário ou perfil não encontrado.');
      this.isLoading = false;
    }
  }

  private extractCategories() {
    const uniqueCategories = new Set<string>();
    this.establishments.forEach(est => {
      if (est.category) {
        uniqueCategories.add(est.category);
      }
    });
    this.categories = Array.from(uniqueCategories);
  }

  filterCompanies(event: any) {
    const searchTerm = event.target?.value?.toLowerCase() || '';
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.establishments];

    if (this.searchTerm) {
      filtered = filtered.filter(est =>
        est.name?.toLowerCase().includes(this.searchTerm) ||
        est.storeSubtitle?.toLowerCase().includes(this.searchTerm) ||
        est.category?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredEstablishments = filtered;
  }

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || '#6b7280';
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
    event.target.parentElement.querySelector('.default-company-logo').style.display = 'flex';
  }

  onContentScroll(event: any) {
    const scrollTop = event.detail.scrollTop;

    this.ionContent.getScrollElement().then(scrollElement => {
      const scrollHeight = scrollElement.scrollHeight;
      const offsetHeight = scrollElement.offsetHeight;

      const isAtBottom = scrollTop + offsetHeight >= scrollHeight - 10;
      this.showScrollIndicator = !isAtBottom;
    });
  }

  getBack() {
    this.navCtrl.back();
  }

  async handleCompanyClick(est: StoreModel) {
    this.loadingCompanyId = est.id;
    this.session.setStore(est);

    try {
      const useAgendaResponse = await firstValueFrom(
        this.employeeStoreService.useAgenda(this.user.id, est.id)
      );

      const isQueueOpenToday = await firstValueFrom(
        this.queueService.hasOpenQueueForEmployeeToday(this.user?.id, est.id)
      );

      this.user.useAgenda = useAgendaResponse.data;
      this.session.setUser(this.user);

      this.navigateToDestination(isQueueOpenToday);
    } finally {
      this.loadingCompanyId = null;
    }
  }

  updateEmployeeConfig(id: number, storeId: number) {
    this.employeeStoreService.useAgenda(id, storeId).subscribe({
      next: (response) => {
        this.user.useAgenda = response.data;
        this.session.setUser(this.user);
      }
    });
  }

  private navigateToDestination(isQueueOpenToday: boolean) {    
    if (this.profileSelected === 2) {
      this.router.navigate(['/queue-list-for-owner']);
    } else if (isQueueOpenToday && !this.user.useAgenda) {
      this.router.navigate(['/customer-list-in-queue']);
    } else if (this.user.useAgenda) {
      this.router.navigate(['/owner-schedule']);
    } else {
      this.router.navigate(['/queue-admin']);
    }
  }

  isStoreOpen(est: StoreModel): boolean {
    return est.isOpen !== undefined ? est.isOpen : true;
  }
}