create table companies
(
    id                         int auto_increment
        primary key,
    name                       varchar(255)                       not null,
    hr_name                    varchar(255)                       null,
    hr_email                   varchar(255)                       not null,
    email                      varchar(255)                       null,
    phoneNumber                varchar(255)                       null,
    contact                    varchar(255)                       null,
    address                    varchar(255)                       null,
    province                   varchar(255)                       null,
    district                   varchar(255)                       null,
    sub_district               varchar(255)                       null,
    postal_code                varchar(255)                       null,
    tax_number                 varchar(255)                       null,
    report_email               json                               null,
    report_date                int                                null,
    employeeLimit              int      default 5                 null,
    hasDepartment              tinyint  default 0                 null,
    hasManager                 tinyint  default 0                 null,
    manager_name               varchar(255)                       null,
    manager_email              varchar(255)                       null,
    manager_tel                varchar(255)                       null,
    vacationStatus             int      default 0                 null,
    hourDay                    int      default 8                 null,
    suspend                    tinyint  default 0                 null,
    id_subscription_plan_table int                                null,
    created_at                 datetime default CURRENT_TIMESTAMP null,
    id_project                 varchar(20)                        null
);

create table employees
(
    id                    int auto_increment
        primary key,
    name                  varchar(255)                        not null,
    ID_or_Passport_Number varchar(13)                         not null,
    companyId             int                                 not null,
    lineUserId            varchar(255)                        null,
    idvacation            int                                 null,
    MaternityLeaveStatus  int       default 0                 null,
    start_date            date                                null,
    dayOff                varchar(255)                        null,
    dayOff_Status         int       default 0                 null,
    probationStatus       int       default 0                 null,
    departmentId          int                                 null,
    resign_date           date                                null,
    createdAt             timestamp default CURRENT_TIMESTAMP null,
    updated_at            timestamp                           null on update CURRENT_TIMESTAMP,
    created_at            datetime  default CURRENT_TIMESTAMP null,
    constraint fk_employee_department
        foreign key (departmentId) references departments (id),
    constraint fk_vacation
        foreign key (idvacation) references vacationLeave (id),
    constraint fk_idvacation
        foreign key (idvacation) references vacationLeave (id)
);

create index idx_active_employees
    on employees (companyId, resign_date);

create index idx_employee_lookup
    on employees (lineUserId, ID_or_Passport_Number, companyId, resign_date);

create index idx_employee_name
    on employees (name);

create index idx_employees_active
    on employees (companyId, resign_date);

create index idx_employees_lookup
    on employees (lineUserId, ID_or_Passport_Number, resign_date);

create table holidays
(
    id         int auto_increment
        primary key,
    name       varchar(255) not null,
    short_name varchar(2)   null,
    date       varchar(255) null,
    lunar_date varchar(255) null,
    companyId  int          not null,
    constraint holidays_ibfk_1
        foreign key (companyId) references companies (id)
);

create index holidays_ibfk_1_idx
    on holidays (companyId);

create table leave_types
(
    id                 int auto_increment
        primary key,
    name               varchar(255)  null,
    short_name         varchar(3)    null,
    max_days           int           null,
    companyId          int           null,
    allow_hourly_leave int default 1 null,
    showStatus         int default 1 null,
    constraint leave_types_ibfk_1
        foreign key (companyId) references companies (id)
);

create table leave_requests
(
    id                 int auto_increment
        primary key,
    employeeId         int                                 not null,
    leave_type_id      int                                 null,
    start_date         date                                null,
    end_date           date                                null,
    days_requested     int                                 null,
    hours_requested    int                                 null,
    status             varchar(50)                         not null,
    companyId          int                                 null,
    vacationId         int                                 null,
    reason             text                                null,
    approval_flow      json                                null,
    current_approver   varchar(50)                         null,
    approval_completed varchar(45)                         null,
    start_time         time                                null,
    end_time           time                                null,
    attach_file        longtext                            null,
    email_status       varchar(45)                         null,
    line_status        varchar(45)                         null,
    createdAt          timestamp default CURRENT_TIMESTAMP null,
    updated_at         timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint leave_requests_ibfk_1
        foreign key (employeeId) references employees (id),
    constraint leave_requests_ibfk_2
        foreign key (leave_type_id) references leave_types (id),
    constraint leave_requests_ibfk_3
        foreign key (companyId) references companies (id),
    constraint leave_requests_ibfk_4
        foreign key (vacationId) references vacationLeave (id)
);

create index companyId
    on leave_requests (companyId);

create index employeeId
    on leave_requests (employeeId);

create index leave_requests_ibfk_4_idx
    on leave_requests (vacationId);

create index companyId
    on leave_types (companyId);

create table swap_requests
(
    id                 int auto_increment
        primary key,
    employeeId         int                                                                           not null,
    holiday_name       varchar(255)                                                                  not null,
    postpone_name      varchar(45)                                                                   null,
    original_date      date                                                                          not null,
    new_date           date                                                                          not null,
    reason             text                                                                          null,
    companyId          int                                                                           null,
    approval_flow      json                                                                          null,
    current_approver   varchar(50)                                                                   null,
    approval_completed varchar(45)                                                                   null,
    status             enum ('pending', 'approved', 'changed', 'rejected') default 'pending'         null,
    email_status       varchar(45)                                                                   null,
    line_status        varchar(45)                                                                   null,
    createdAt          timestamp                                           default CURRENT_TIMESTAMP null,
    updated_at         timestamp                                           default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint swap_requests_ibfk_1
        foreign key (employeeId) references employees (id)
);

create index swap_requests_ibfk_1_idx
    on swap_requests (employeeId);

