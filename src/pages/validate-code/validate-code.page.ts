import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';
import { UserService } from 'src/services/user-service';
import { ViewChildren, QueryList } from '@angular/core';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-validate-code',
  templateUrl: './validate-code.page.html',
  styleUrls: ['./validate-code.page.scss'],
})
export class ValidateCodePage {
  code: string[] = ["", "", "", "", "", ""];
  isCodeValid = false;
  newPassword = "";
  confirmPassword = "";
  @ViewChildren('codeInput') codeInputs!: QueryList<IonInput>;

  constructor(private authService: AuthService,
    private toastService: ToastService,
    private sessionService: SessionService,
    private router: Router,
    private userService: UserService) {
  }

  onInput(event: any, index: number) {
    const value: string = event.detail.value || '';

    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').split('');

      chars.slice(0, this.code.length).forEach((char, i) => {
        this.code[i] = char;
      });

      const lastIndex = Math.min(chars.length, this.code.length) - 1;
      this.codeInputs.toArray()[lastIndex]?.setFocus();
      return;
    }

    this.code[index] = value;

    if (value && index < this.codeInputs.length - 1) {
      this.codeInputs.toArray()[index + 1].setFocus();
    }
  }

  validateCode() {
    const userData = this.sessionService.getGenericKey('pendingUser') || '';

    if (!userData) {
      this.toastService.show(
        'Erro ao validar. Por favor, refaça o procedimento em "Esqueci minha senha".',
        'danger'
      );
      return;
    }

    const codeValue = this.code.join("");

    if (codeValue.length !== 6) {
      this.toastService.show('O código deve ter 6 dígitos.', 'warning');
      return;
    }

    this.authService.validateUser({ email: userData.email, codeToValidate: codeValue }).subscribe({
      next: (response: { valid: boolean }) => {

        if (response) {
          this.toastService.show('Código validado com sucesso!', 'success');

          if (!userData.newUser) {
            setTimeout(() => {
              this.isCodeValid = true;
            }, 1000);
          }
          else {
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1000);
          }
        } else {
          this.toastService.show('Código inválido. Tente novamente.', 'danger');
        }
      },
      error: (err) => {
        this.toastService.show('Ocorreu um erro ao validar o código. Tente novamente.', 'danger');
      }
    });
  }

  onKeyDown(event: any, index: number) {    
    if (event.key === 'Backspace') {
      if (!this.code[index] && index > 0) {
        const prevInput = this.codeInputs.toArray()[index - 1];
        prevInput.setFocus();
      }
    }
  }

  updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.show('As senhas não conferem', 'danger');
      return;
    }

    const email = this.sessionService.getGenericKey('pendingUser')?.email;

    this.userService.setNewPassword(email, this.newPassword).subscribe({
      next: () => {
        this.toastService.show('Senha redefinida com sucesso!', 'success');

        setTimeout(() => {
          this.sessionService.removeGenericKey('pendingUser');
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: () => {
        this.toastService.show('Erro ao atualizar senha. Tente novamente.', 'danger');
      }
    });
  }
}