import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';
import { UserService } from 'src/services/user-service';

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

  constructor(private authService: AuthService,
    private toastService: ToastService,
    private sessionService: SessionService,
    private router: Router,
    private userService: UserService) {

  }

  nextInput(event: any, index: number) {
    if (event.target.value && index < 5) {
      const next = document.querySelectorAll("ion-input")[index + 1] as any;
      next.setFocus();
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

  updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.show('As senhas não conferem', 'danger');
      return;
    }

    debugger
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