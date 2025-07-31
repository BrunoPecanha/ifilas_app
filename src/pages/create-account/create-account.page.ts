import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserRequest } from 'src/models/requests/user-request';
import { UserService } from 'src/services/user-service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
})
export class CreateAccountPage {
  name: string = '';
  lastname: string = '';
  cpf: string = '';
  email: string = '';
  phone: string = '';
  ddd: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;

  constructor(private userService: UserService, private router: Router, private alertController: AlertController) { }

  formatPhone(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    value = value.substring(0, 11);

    this.ddd = value.substring(0, 2);
    this.phone = value.substring(2);

    let formatted = '';

    if (this.ddd) {
      formatted += `(${this.ddd}) `;
    }

    if (this.phone.length > 0) {
      formatted += this.phone.charAt(0);
    }

    if (this.phone.length > 1) {
      formatted += this.phone.substring(1, 5);
    }
    if (this.phone.length > 5) {
      formatted += `-${this.phone.substring(5, 9)}`;
    }

    this.phone = this.ddd + this.phone;
    event.target.value = formatted
  }

  formatCPF(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length > 3) {
      value = value.substring(0, 3) + '.' + value.substring(3);
    }
    if (value.length > 7) {
      value = value.substring(0, 7) + '.' + value.substring(7);
    }
    if (value.length > 11) {
      value = value.substring(0, 11) + '-' + value.substring(11);
    }

    this.cpf = value;
    event.target.value = value;
  }

  validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(9, 10))) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(10, 11))) {
      return false;
    }

    return true;
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    const phoneDigits = this.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      const alert = await this.alertController.create({
        header: 'Informação',
        message: 'Por favor, insira um número de telefone válido com DDD (10 ou 11 dígitos).',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.validateCPF(this.cpf)) {
      const alert = await this.alertController.create({
        header: 'Informação',
        message: 'Por favor, insira um cpf válido.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.name || !this.lastname || !this.email || !this.phone || !this.cpf || !this.password || !this.confirmPassword) {
      const alert = await this.alertController.create({
        header: 'Informação',
        message: 'Por favor, preencha todos os campos obrigatórios.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.termsAccepted) {
      const alert = await this.alertController.create({
        header: 'Informação',
        message: 'Você precisa aceitar os termos de uso.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.password !== this.confirmPassword) {
      const alert = await this.alertController.create({
        header: 'Informação',
        message: 'As senhas não coincidem.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    let userData: UserRequest = {
      name: this.name,
      lastName: this.lastname,
      email: this.email,
      phone: phoneDigits,
      cpf: this.cpf.replace(/\D/g, ''),
      password: this.password,
      address: '',
      number: '',
      city: '',
      stateId: ''
    };

    try {
      await this.userService.createUser(userData).toPromise();
      const alert = await this.alertController.create({
        header: 'Sucesso',
        message: 'Cadastro realizado com sucesso!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ],
      });
      await alert.present();

    } catch (err: any) {
      let errorMessage = 'Erro ao cadastrar usuário.';

      if (err?.status === 400 && typeof err.error === 'string') {
        errorMessage = err.error;
      }

      const alert = await this.alertController.create({
        header: 'Erro',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}