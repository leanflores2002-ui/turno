import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, DoctorCreate, DoctorUpdate } from '../../../core/services/doctor.service';
import { OfficeService } from '../../../core/services/office.service';
import { DoctorDto } from '../../../core/models/user';
import { Office } from '../../../core/models/office';

@Component({
  selector: 'app-doctor-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-management.component.html',
  styleUrls: ['./doctor-management.component.scss']
})
export class DoctorManagementComponent implements OnInit {
  doctors: DoctorDto[] = [];
  offices: Office[] = [];
  loading = false;
  error: string | null = null;
  
  // Form state
  showCreateForm = false;
  editingDoctor: DoctorDto | null = null;
  
  // Form data
  formData: DoctorCreate = {
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false,
    specialty: '',
    license_number: '',
    years_experience: 0,
    office_id: undefined
  };

  constructor(
    private doctorService: DoctorService,
    private officeService: OfficeService
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.loadOffices();
  }

  loadDoctors(): void {
    this.loading = true;
    this.error = null;
    
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar doctores';
        this.loading = false;
        console.error('Error loading doctors:', err);
      }
    });
  }

  loadOffices(): void {
    this.officeService.getOffices().subscribe({
      next: (offices) => {
        this.offices = offices;
      },
      error: (err) => {
        console.error('Error loading offices:', err);
      }
    });
  }

  showCreateDoctorForm(): void {
    this.editingDoctor = null;
    this.formData = {
      email: '',
      password: '',
      full_name: '',
      is_active: true,
      is_superuser: false,
      specialty: '',
      license_number: '',
      years_experience: 0,
      office_id: undefined
    };
    this.showCreateForm = true;
  }

  showEditDoctorForm(doctor: DoctorDto): void {
    this.editingDoctor = doctor;
    this.formData = {
      email: doctor.email,
      password: '',
      full_name: doctor.full_name || '',
      is_active: doctor.is_active,
      is_superuser: doctor.is_superuser,
      specialty: doctor.specialty || '',
      license_number: doctor.license_number || '',
      years_experience: doctor.years_experience || 0,
      office_id: doctor.office_id || undefined
    };
    this.showCreateForm = true;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingDoctor = null;
    this.formData = {
      email: '',
      password: '',
      full_name: '',
      is_active: true,
      is_superuser: false,
      specialty: '',
      license_number: '',
      years_experience: 0,
      office_id: undefined
    };
  }

  onSubmit(): void {
    if (!this.formData.email.trim()) {
      this.error = 'El email es obligatorio';
      return;
    }
    if (!this.editingDoctor && !this.formData.password.trim()) {
      this.error = 'La contraseña es obligatoria para nuevos usuarios';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.editingDoctor) {
      // Update existing doctor
      const updateData: DoctorUpdate = {
        email: this.formData.email,
        full_name: this.formData.full_name || undefined,
        is_active: this.formData.is_active,
        is_superuser: this.formData.is_superuser,
        specialty: this.formData.specialty || undefined,
        license_number: this.formData.license_number || undefined,
        years_experience: this.formData.years_experience,
        // Map undefined to null to explicitly unassign when choosing "Sin asignar"
        office_id: this.formData.office_id === undefined ? null : this.formData.office_id
      };

      // Only include password if provided
      if (this.formData.password.trim()) {
        updateData.password = this.formData.password;
      }

      this.doctorService.updateDoctor(this.editingDoctor.id, updateData).subscribe({
        next: () => {
          this.loadDoctors();
          this.cancelForm();
        },
        error: (err) => {
          this.error = 'Error al actualizar doctor';
          this.loading = false;
          console.error('Error updating doctor:', err);
        }
      });
    } else {
      // Create new doctor
      this.doctorService.createDoctor(this.formData).subscribe({
        next: () => {
          this.loadDoctors();
          this.cancelForm();
        },
        error: (err) => {
          this.error = 'Error al crear doctor';
          this.loading = false;
          console.error('Error creating doctor:', err);
        }
      });
    }
  }

  deleteDoctor(doctor: DoctorDto): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar al doctor "${doctor.full_name || doctor.email}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.doctorService.deleteDoctor(doctor.id).subscribe({
      next: () => {
        this.loadDoctors();
      },
      error: (err) => {
        this.error = 'Error al eliminar doctor';
        this.loading = false;
        console.error('Error deleting doctor:', err);
      }
    });
  }

  getOfficeName(officeId: number | null | undefined): string {
    if (!officeId) return 'Sin asignar';
    const office = this.offices.find(o => o.id === officeId);
    return office ? (office.name || office.code) : 'Consultorio no encontrado';
  }
}
