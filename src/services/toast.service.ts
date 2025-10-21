import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  error(arg0: string) {
    throw new Error('Method not implemented.');
  }
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
}
