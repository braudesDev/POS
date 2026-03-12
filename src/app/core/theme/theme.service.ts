import {
  Injectable,
  effect,
  inject,
  Renderer2,
  RendererFactory2,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private document = inject(DOCUMENT);
  private readonly THEME_KEY = 'app-theme-pdv';

  // Signal reactivo para el tema actual
  private currentThemeSignal = signal<ThemeMode>('system');
  currentTheme = this.currentThemeSignal.asReadonly();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Cargar tema guardado o usar system por defecto
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode | null;
    this.currentThemeSignal.set(savedTheme || 'system');

    // Efecto reactivo que se ejecuta cuando cambia el tema
    effect(() => {
      const theme = this.currentThemeSignal();
      this.applyTheme(theme);
      this.saveTheme(theme);
    });
  }

  setTheme(theme: ThemeMode): void {
    this.currentThemeSignal.set(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const htmlElement = this.document.documentElement;

    // Remover clases existentes
    this.renderer.removeClass(htmlElement, 'theme-light');
    this.renderer.removeClass(htmlElement, 'theme-dark');

    // Aplicar según la selección
    if (theme === 'light') {
      this.renderer.addClass(htmlElement, 'theme-light');
    } else if (theme === 'dark') {
      this.renderer.addClass(htmlElement, 'theme-dark');
    }
    // system: no añadimos clase, usa color-scheme del HTML
  }

  private saveTheme(theme: ThemeMode): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  // Método útil para saber si estamos en modo oscuro
  isDarkMode(): boolean {
    const theme = this.currentThemeSignal();
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // system: detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
