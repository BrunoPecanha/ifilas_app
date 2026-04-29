import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const isLogged = !!sessionStorage.getItem('user'); 

    if (!isLogged) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}