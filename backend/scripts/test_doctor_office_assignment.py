#!/usr/bin/env python3
"""
Test script for doctor-office assignment functionality.

This script tests the complete flow of:
1. Creating offices
2. Creating doctors with office assignments
3. Updating doctor office assignments
4. Listing doctors with office information
5. Deleting offices (should set doctor office_id to NULL)
"""

import sys
from datetime import datetime
from typing import List, Optional

# Add the src directory to the path
sys.path.insert(0, '/home/diego/sandbox/turnoplus/backend/src')

from app.db.broker import get_dbbroker
from app.services.offices import OfficesService
from app.services.doctors import DoctorsService
from app.schemas.office import OfficeCreate, OfficeUpdate
from app.schemas.user import DoctorCreate, DoctorUpdate


class DoctorOfficeAssignmentTester:
    def __init__(self):
        self.broker = get_dbbroker()
        self.offices_service = OfficesService()
        self.doctors_service = DoctorsService()
        self.created_offices: List[int] = []
        self.created_doctors: List[int] = []

    def log(self, message: str, status: str = "INFO") -> None:
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status:<7} {message}")

    def test_create_offices(self) -> bool:
        """Test creating offices."""
        self.log("Testing office creation...")
        
        try:
            # Create test offices
            office1_data = OfficeCreate(
                code="OFC-001",
                name="Consultorio Central",
                address="Av. Principal 123, Ciudad"
            )
            office1 = self.offices_service.create(office1_data)
            self.created_offices.append(office1.id)
            self.log(f"✓ Created office: {office1.name} (ID: {office1.id})")

            office2_data = OfficeCreate(
                code="OFC-002", 
                name="Consultorio Norte",
                address="Calle Norte 456, Ciudad"
            )
            office2 = self.offices_service.create(office2_data)
            self.created_offices.append(office2.id)
            self.log(f"✓ Created office: {office2.name} (ID: {office2.id})")

            return True
        except Exception as e:
            self.log(f"✗ Failed to create offices: {e}", "ERROR")
            return False

    def test_create_doctors_with_offices(self) -> bool:
        """Test creating doctors with office assignments."""
        self.log("Testing doctor creation with office assignments...")
        
        try:
            # Create doctor with office assignment
            doctor1_data = DoctorCreate(
                email="doctor1@test.com",
                password="testpass123",
                full_name="Dr. Juan Pérez",
                specialty="Clínica General",
                license_number="MAT-001",
                years_experience=5,
                office_id=self.created_offices[0]  # Assign to first office
            )
            doctor1 = self.doctors_service.create(doctor1_data)
            self.created_doctors.append(doctor1.id)
            self.log(f"✓ Created doctor: {doctor1.full_name} assigned to office {doctor1.office_id}")

            # Create doctor without office assignment
            doctor2_data = DoctorCreate(
                email="doctor2@test.com",
                password="testpass123",
                full_name="Dr. María García",
                specialty="Cardiología",
                license_number="MAT-002",
                years_experience=10
                # No office_id - should be None
            )
            doctor2 = self.doctors_service.create(doctor2_data)
            self.created_doctors.append(doctor2.id)
            self.log(f"✓ Created doctor: {doctor2.full_name} without office assignment")

            return True
        except Exception as e:
            self.log(f"✗ Failed to create doctors: {e}", "ERROR")
            return False

    def test_update_doctor_office_assignment(self) -> bool:
        """Test updating doctor office assignments."""
        self.log("Testing doctor office assignment updates...")
        
        try:
            # Update doctor to assign to second office
            update_data = DoctorUpdate(office_id=self.created_offices[1])
            updated_doctor = self.doctors_service.update(self.created_doctors[0], update_data)
            
            if updated_doctor and updated_doctor.office_id == self.created_offices[1]:
                self.log(f"✓ Updated doctor office assignment to office {updated_doctor.office_id}")
                return True
            else:
                self.log("✗ Failed to update doctor office assignment", "ERROR")
                return False
        except Exception as e:
            self.log(f"✗ Failed to update doctor office assignment: {e}", "ERROR")
            return False

    def test_list_doctors_with_offices(self) -> bool:
        """Test listing doctors with office information."""
        self.log("Testing doctor listing with office information...")
        
        try:
            doctors = self.doctors_service.list()
            self.log(f"✓ Found {len(doctors)} doctors")
            
            for doctor in doctors:
                office_info = f"Office {doctor.office_id}" if doctor.office_id else "No office"
                self.log(f"  - {doctor.full_name}: {office_info}")
            
            return True
        except Exception as e:
            self.log(f"✗ Failed to list doctors: {e}", "ERROR")
            return False

    def test_delete_office_with_doctors(self) -> bool:
        """Test deleting office with assigned doctors (should set office_id to NULL)."""
        self.log("Testing office deletion with assigned doctors...")
        
        try:
            # First verify doctor has office assignment
            doctor = self.doctors_service.get(self.created_doctors[0])
            if not doctor or not doctor.office_id:
                self.log("✗ Doctor should have office assignment before deletion", "ERROR")
                return False
            
            self.log(f"Doctor {doctor.full_name} currently assigned to office {doctor.office_id}")
            
            # Delete the office
            success = self.offices_service.delete(self.created_offices[1])
            if not success:
                self.log("✗ Failed to delete office", "ERROR")
                return False
            
            # Verify doctor's office_id is now NULL
            updated_doctor = self.doctors_service.get(self.created_doctors[0])
            if updated_doctor and updated_doctor.office_id is None:
                self.log("✓ Doctor office assignment correctly set to NULL after office deletion")
                return True
            else:
                self.log("✗ Doctor office assignment not set to NULL after office deletion", "ERROR")
                return False
        except Exception as e:
            self.log(f"✗ Failed to test office deletion: {e}", "ERROR")
            return False

    def test_office_validation(self) -> bool:
        """Test office validation when creating/updating doctors."""
        self.log("Testing office validation...")
        
        try:
            # Try to create doctor with non-existent office
            doctor_data = DoctorCreate(
                email="doctor3@test.com",
                password="testpass123",
                full_name="Dr. Test Invalid",
                office_id=99999  # Non-existent office
            )
            
            try:
                self.doctors_service.create(doctor_data)
                self.log("✗ Should have failed with non-existent office", "ERROR")
                return False
            except ValueError as e:
                if "does not exist" in str(e):
                    self.log("✓ Correctly rejected doctor with non-existent office")
                else:
                    self.log(f"✗ Unexpected error: {e}", "ERROR")
                    return False
            
            return True
        except Exception as e:
            self.log(f"✗ Failed to test office validation: {e}", "ERROR")
            return False

    def cleanup(self) -> None:
        """Clean up created test data."""
        self.log("Cleaning up test data...")
        
        # Delete doctors
        for doctor_id in self.created_doctors:
            try:
                self.doctors_service.delete(doctor_id)
                self.log(f"✓ Deleted doctor {doctor_id}")
            except Exception as e:
                self.log(f"✗ Failed to delete doctor {doctor_id}: {e}", "ERROR")
        
        # Delete offices
        for office_id in self.created_offices:
            try:
                self.offices_service.delete(office_id)
                self.log(f"✓ Deleted office {office_id}")
            except Exception as e:
                self.log(f"✗ Failed to delete office {office_id}: {e}", "ERROR")

    def run_all_tests(self) -> bool:
        """Run all tests and return success status."""
        self.log("Starting doctor-office assignment tests...")
        
        tests = [
            ("Create Offices", self.test_create_offices),
            ("Create Doctors with Offices", self.test_create_doctors_with_offices),
            ("Update Doctor Office Assignment", self.test_update_doctor_office_assignment),
            ("List Doctors with Offices", self.test_list_doctors_with_offices),
            ("Office Validation", self.test_office_validation),
            ("Delete Office with Doctors", self.test_delete_office_with_doctors),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"Running test: {test_name}")
            if test_func():
                passed += 1
                self.log(f"✓ {test_name} PASSED")
            else:
                self.log(f"✗ {test_name} FAILED", "ERROR")
            print()  # Empty line for readability
        
        self.log(f"Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed!", "SUCCESS")
            return True
        else:
            self.log(f"❌ {total - passed} tests failed", "ERROR")
            return False


def main() -> int:
    """Main function to run the tests."""
    tester = DoctorOfficeAssignmentTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        tester.log(f"Unexpected error: {e}", "ERROR")
        return 1
    finally:
        tester.cleanup()


if __name__ == "__main__":
    sys.exit(main())
