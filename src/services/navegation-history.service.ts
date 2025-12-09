import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavegationHistoryService {
  private history: string[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        const last = this.history[this.history.length - 1];
        if (last !== url) {
          this.history.push(url);
        }
      });
  }

  add(route: string) {
    const last = this.history[this.history.length - 1];
    if (last !== route) {
      this.history.push(route);
    }
  }

  back(): string | null {
    if (this.history.length <= 1) {
      return null;
    }

    this.history.pop();

    const previous = this.history[this.history.length - 1] || null;
    return previous;
  }

  hasHistory(): boolean {
    return this.history.length > 1;
  }
}