import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async show(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium' = 'success'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: `toast-${color}`,
    });
    await toast.present();
  }

  async error(message: string) {
    await this.show(message || 'Erro inesperado', 'danger');
  }

  async success(message: string) {
    await this.show(message, 'success');
  }

  async warning(message: string) {
    await this.show(message, 'warning');
  }
}