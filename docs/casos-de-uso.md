🧍‍♂️ USR - Casos de uso
ID	Título	Precondición	Postcondición
USR-01	El usuario se registra	N/A	Usuario registrado
USR-02	El usuario inicia sesión	Usuario registrado	Usuario registrado y logueado
USR-03	El usuario modifica sus datos personales	Usuario logueado	Datos del usuario actualizados
USR-04	El usuario solicita turno	Usuario logueado	Usuario saca un turno
USR-05	El usuario cancela turno	Usuario logueado y turno existente	El usuario modifica o cancela turno
USR-06	El usuario consulta turnos agendados	Usuario logueado	Consulta turno
USR-07	El usuario consulta ficha clínica	Usuario logueado	Ve su ficha clínica

🩺 DOC - Casos de uso
ID	Título	Precondición	Postcondición
DOC-01	El doctor inicia sesión	Doctor registrado en el sistema	Doctor logueado
DOC-02	El doctor ingresa disponibilidad	Doctor logueado	Registra disponibilidad
DOC-03	El doctor modifica disponibilidad	Doctor logueado	Modifica su disponibilidad
DOC-04	El doctor modifica ficha clínica	Doctor logueado	Modifica ficha clínica
DOC-05	El doctor consulta ficha clínica	Doctor logueado	Consulta ficha clínica

🧑‍💼 ADMIN - Casos de uso
ID	Título	Precondición	Postcondición
ADMIN-01	El administrador inicia sesión	El administrador logueado	Un nuevo doctor
ADMIN-02	El administrador da de alta un nuevo doctor	El administrador logueado	Un nuevo doctor
ADMIN-03	El administrador da de baja un doctor	El administrador logueado	Da de baja un doctor
ADMIN-04	El administrador crea consultorio	El administrador logueado	Alta consultorio
ADMIN-05	El administrador elimina consultorio	El administrador logueado	Elimina consultorio