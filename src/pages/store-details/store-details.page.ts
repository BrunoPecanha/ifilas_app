import { Component, OnInit } from '@angular/core';
import {  ActivatedRoute } from '@angular/router';
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
  isInfoModalOpen: boolean = false;
  isLoading: boolean = true; 

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
      this.loadServices()
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
}
