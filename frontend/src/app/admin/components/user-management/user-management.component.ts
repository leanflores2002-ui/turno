import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { DoctorService, DoctorCreate, DoctorUpdate } from '../../../core/services/doctor.service';
import { PatientsService } from '../../../core/services/patients.service';
import { OfficeService } from '../../../core/services/office.service';
import { UserDto, DoctorDto, PatientDto } from '../../../core/models/user';
import { Office } from '../../../core/models/office';

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role: 'patient' | 'doctor' | 'admin';
  // Patient specific fields
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
  // Doctor specific fields
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
  // Admin specific fields
  admin_role?: 'superadmin' | 'manager' | 'support';
  permissions?: string[];
}

export interface UserUpdate {
  password?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string;
  role?: 'patient' | 'doctor' | 'admin';
  // Patient specific fields
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
  // Doctor specific fields
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
  // Admin specific fields
  admin_role?: 'superadmin' | 'manager' | 'support';
  permissions?: string[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: (UserDto | DoctorDto | PatientDto)[] = [];
  offices: Office[] = [];
  loading = false;
  error: string | null = null;
  
  // Form state
  showCreateForm = false;
  editingUser: (UserDto | DoctorDto | PatientDto) | null = null;
  selectedRole: 'patient' | 'doctor' | 'admin' = 'patient';
  
  // Form data
  formData: UserCreate = {
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false,
    role: 'patient'
  };

  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private patientService: PatientsService,
    private officeService: OfficeService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadOffices();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    // Load all types of users
    Promise.all([
      this.userService.getUsers().toPromise(),
      this.doctorService.getDoctors().toPromise(),
      this.patientService.getPatients().toPromise()
    ]).then(([users, doctors, patients]) => {
      this.users = [
        ...(users || []),
        ...(doctors || []),
        ...(patients || [])
      ].sort((a, b) => a.full_name?.localeCompare(b.full_name || '') || 0);
      this.loading = false;
    }).catch((err) => {
      this.error = 'Error al cargar usuarios';
      this.loading = false;
      console.error('Error loading users:', err);
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

  showCreateUserForm(): void {
    this.editingUser = null;
    this.selectedRole = 'patient';
    this.resetForm();
    this.showCreateForm = true;
  }

  showEditUserForm(user: UserDto | DoctorDto | PatientDto): void {
    this.editingUser = user;
    this.selectedRole = user.role as 'patient' | 'doctor' | 'admin';
    this.resetForm();
    
    // Populate form with user data
    this.formData = {
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      role: user.role as 'patient' | 'doctor' | 'admin'
    };

    // Add role-specific fields
    if (user.role === 'patient' && 'date_of_birth' in user) {
      this.formData.date_of_birth = user.date_of_birth || '';
      this.formData.medical_record_number = user.medical_record_number || '';
      this.formData.emergency_contact = user.emergency_contact || '';
    } else if (user.role === 'doctor' && 'specialty' in user) {
      this.formData.specialty = user.specialty || '';
      this.formData.license_number = user.license_number || '';
      this.formData.years_experience = user.years_experience || 0;
      this.formData.office_id = user.office_id || undefined;
    } else if (user.role === 'admin' && 'admin_role' in user) {
      this.formData.admin_role = (user as any).admin_role || 'support';
      this.formData.permissions = (user as any).permissions || [];
    }

    this.showCreateForm = true;
  }

  resetForm(): void {
    this.formData = {
      email: '',
      password: '',
      full_name: '',
      is_active: true,
      is_superuser: false,
      role: this.selectedRole
    };
  }

  onRoleChange(): void {
    this.formData.role = this.selectedRole;
    this.resetForm();
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingUser = null;
    this.resetForm();
  }

  onSubmit(): void {
    if (!this.formData.email.trim() || !this.formData.password.trim()) {
      this.error = 'Email y contraseña son obligatorios';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.editingUser) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    let serviceCall;
    switch (this.formData.role) {
      case 'doctor':
        serviceCall = this.doctorService.createDoctor(this.formData as DoctorCreate);
        break;
      case 'patient':
        serviceCall = this.patientService.createPatient(this.formData as any);
        break;
      case 'admin':
        serviceCall = this.userService.createUser(this.formData as any);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loadUsers();
        this.cancelForm();
      },
      error: (err: any) => {
        this.error = `Error al crear ${this.formData.role}`;
        this.loading = false;
        console.error('Error creating user:', err);
      }
    });
  }

  private updateUser(): void {
    if (!this.editingUser) return;

    const updateData: UserUpdate = {
      email: this.formData.email,
      full_name: this.formData.full_name || undefined,
      is_active: this.formData.is_active,
      is_superuser: this.formData.is_superuser,
      role: this.formData.role
    };

    // Only include password if provided
    if (this.formData.password.trim()) {
      updateData.password = this.formData.password;
    }

    // Add role-specific fields
    if (this.formData.role === 'patient') {
      updateData.date_of_birth = this.formData.date_of_birth || undefined;
      updateData.medical_record_number = this.formData.medical_record_number || undefined;
      updateData.emergency_contact = this.formData.emergency_contact || undefined;
    } else if (this.formData.role === 'doctor') {
      updateData.specialty = this.formData.specialty || undefined;
      updateData.license_number = this.formData.license_number || undefined;
      updateData.years_experience = this.formData.years_experience || undefined;
      updateData.office_id = this.formData.office_id || undefined;
    } else if (this.formData.role === 'admin') {
      updateData.admin_role = this.formData.admin_role || undefined;
      updateData.permissions = this.formData.permissions || undefined;
    }

    let serviceCall;
    switch (this.formData.role) {
      case 'doctor':
        serviceCall = this.doctorService.updateDoctor(this.editingUser.id, updateData as DoctorUpdate);
        break;
      case 'patient':
        serviceCall = this.patientService.updatePatient(this.editingUser.id, updateData as any);
        break;
      case 'admin':
        serviceCall = this.userService.updateUser(this.editingUser.id, updateData as any);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loadUsers();
        this.cancelForm();
      },
      error: (err: any) => {
        this.error = `Error al actualizar ${this.formData.role}`;
        this.loading = false;
        console.error('Error updating user:', err);
      }
    });
  }

  deleteUser(user: UserDto | DoctorDto | PatientDto): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.full_name || user.email}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    let serviceCall;
    switch (user.role) {
      case 'doctor':
        serviceCall = this.doctorService.deleteDoctor(user.id);
        break;
      case 'patient':
        serviceCall = this.patientService.deletePatient(user.id);
        break;
      case 'admin':
        serviceCall = this.userService.deleteUser(user.id);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err: any) => {
        this.error = `Error al eliminar ${user.role}`;
        this.loading = false;
        console.error('Error deleting user:', err);
      }
    });
  }

  getOfficeName(officeId: number | null | undefined): string {
    if (!officeId) return 'Sin asignar';
    const office = this.offices.find(o => o.id === officeId);
    return office ? (office.name || office.code) : 'Consultorio no encontrado';
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'patient': 'Paciente',
      'doctor': 'Doctor',
      'admin': 'Administrador'
    };
    return roleNames[role] || role;
  }

  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      'patient': 'person',
      'doctor': 'medical_services',
      'admin': 'admin_panel_settings'
    };
    return roleIcons[role] || 'person';
  }
}
