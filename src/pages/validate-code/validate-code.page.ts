import { Component } from '@angular/core';

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

  nextInput(event: any, index: number) {
    if (event.target.value && index < 5) {
      const next = document.querySelectorAll("ion-input")[index + 1] as any;
      next.setFocus();
    }
  }

  validateCode() {
    const codeValue = this.code.join("");
    if (codeValue.length === 6) {
      // Chamada para backend validar código
      this.isCodeValid = true; // Ao validar, substitui a tela
    } else {
      console.log("Código inválido");
    }
  }

  updatePassword() {
    if (this.newPassword === this.confirmPassword) {
      // Chamada para backend salvar senha
      console.log("Senha redefinida!");
    } else {
      console.log("As senhas não conferem");
    }
  }

  cancelPasswordReset() {
    this.isCodeValid = false;
    this.code = ["", "", "", "", "", ""]; // opcional: limpa os inputs
    this.newPassword = "";
    this.confirmPassword = "";
  }

  returnToLogin() {
    // Navegar de volta para a tela de login
    console.log("Retornando para a tela de login");
  }


  resendCode() {
    // Chamada para backend reenviar o código
    console.log("Novo código enviado para o e-mail do usuário");
  }
}
