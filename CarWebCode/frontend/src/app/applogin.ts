
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  email = '';
  password = '';
  mensaje = '';
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  iniciarSesion(event: Event): void {
    event.preventDefault();

    if (this.cargando) return;

    this.mensaje = '';
    this.cargando = true;

    this.http.post<any>(
      'http://localhost:3000/api/users/login',
      {
        email: this.email,
        password: this.password
      }
    ).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.message || 'Inicio de sesión exitoso';
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.mensaje =
          error.error?.message || 'No se pudo conectar con el servidor';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
