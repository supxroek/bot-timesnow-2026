create table companies
(
    id            int auto_increment
        primary key,
    name          varchar(255)                       not null,
    branch        varchar(5)                         null,
    email         varchar(255)                       null,
    phoneNumber   varchar(255)                       null,
    contactPerson varchar(255)                       null,
    address       varchar(255)                       null,
    province      varchar(255)                       null,
    district      varchar(255)                       null,
    sub_district  varchar(255)                       null,
    postal_code   varchar(255)                       null,
    tax_id        varchar(255)                       null,
    hasDepartment tinyint  default 0                 null,
    employeeLimit int      default 5                 null,
    hr_name       varchar(255)                       null,
    hr_email      varchar(255)                       not null,
    report_date   int                                not null,
    created_at    datetime default CURRENT_TIMESTAMP null
);

create table department
(
    id             int auto_increment
        primary key,
    departmentName varchar(255) null,
    headDep_email  varchar(255) null,
    headDep_name   varchar(255) null,
    headDep_tel    varchar(255) null,
    companyId      int          not null
);

create table devIO
(
    id          int auto_increment
        primary key,
    name        varchar(255)                       null,
    locationURL varchar(255)                       null,
    HWID        varchar(45)                        not null,
    Passcode    varchar(45)                        not null,
    employeeId  longtext                           not null,
    companyId   int                                not null,
    created_at  datetime default CURRENT_TIMESTAMP null
);

create table employees
(
    id                    int auto_increment
        primary key,
    name                  varchar(255)                        not null,
    ID_or_Passport_Number varchar(13)                         null,
    companyId             int                                 not null,
    lineUserId            varchar(255)                        null,
    start_date            date                                null,
    departmentId          int                                 null,
    dayOff                varchar(255)                        null,
    resign_date           date                                null,
    created_at            timestamp default CURRENT_TIMESTAMP null,
    constraint idx_id_passport_company
        unique (ID_or_Passport_Number, companyId),
    constraint uq_employee_id_company
        unique (ID_or_Passport_Number, companyId, resign_date),
    constraint uq_employee_line_company
        unique (lineUserId, companyId)
);

create table forget_timestamp_requests
(
    id             int auto_increment
        primary key,
    request_id     varchar(50)                                                              not null,
    employee_id    int                                                                      not null,
    company_id     int                                                                      not null,
    timestamp_type enum ('work_in', 'break_in', 'ot_in', 'work_out', 'break_out', 'ot_out') not null,
    forget_date    date                                                                     not null,
    forget_time    time                                                                     not null,
    reason         text                                                                     not null,
    evidence       longtext                                                                 null,
    status         enum ('pending', 'approved', 'rejected') default 'pending'               null,
    created_at     timestamp                                default CURRENT_TIMESTAMP       null,
    approved_at    timestamp                                                                null,
    constraint request_id
        unique (request_id),
    constraint forget_timestamp_requests_ibfk_1
        foreign key (employee_id) references employees (id),
    constraint forget_timestamp_requests_ibfk_2
        foreign key (company_id) references companies (id)
)
    collate = utf8mb4_unicode_ci;

create index company_id
    on forget_timestamp_requests (company_id);

create index idx_employee_company
    on forget_timestamp_requests (employee_id, company_id);

create index idx_request_id
    on forget_timestamp_requests (request_id);

create index idx_status
    on forget_timestamp_requests (status);

create table overtime
(
    id            int auto_increment
        primary key,
    overTimeName  varchar(255)                       not null,
    ot_start_time time                               not null,
    ot_end_time   time                               not null,
    companyId     int                                not null,
    employeeId    longtext                           not null,
    created_at    datetime default CURRENT_TIMESTAMP null
);

create table timestamp_records
(
    id               int auto_increment
        primary key,
    employeeid       int                                not null,
    workingTimeId    int                                not null,
    start_time       time                               null,
    break_start_time time                               null,
    break_end_time   time                               null,
    end_time         time                               null,
    otStatus         int      default 0                 not null,
    overtimeId       int                                null,
    ot_start_time    time                               null,
    ot_end_time      time                               null,
    companyId        int                                not null,
    created_at       datetime default CURRENT_TIMESTAMP null
);

create index idx_timestamp_employee_date
    on timestamp_records (employeeid, created_at);

create table users
(
    id            int auto_increment
        primary key,
    email         varchar(255)                                     not null,
    password_hash varchar(255)                                     not null,
    role          enum ('admin', 'user') default 'user'            not null,
    company_id    int                                              null,
    is_active     tinyint(1)             default 1                 null,
    last_login    datetime                                         null,
    created_at    datetime               default CURRENT_TIMESTAMP null,
    updated_at    datetime               default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint idx_users_username
        unique (email),
    constraint fk_users_company
        foreign key (company_id) references companies (id)
            on delete set null
);

create table refresh_tokens
(
    id               int auto_increment
        primary key,
    user_id          int                                  not null,
    token            varchar(512)                         not null,
    expires_at       datetime                             not null,
    revoked          tinyint(1) default 0                 null,
    created_at       datetime   default CURRENT_TIMESTAMP null,
    replace_by_token varchar(512)                         null,
    constraint fk_tokens_user
        foreign key (user_id) references users (id)
            on delete cascade
);

create index idx_tokens_token
    on refresh_tokens (token);

create index idx_tokens_user
    on refresh_tokens (user_id);

create index idx_users_company_id
    on users (company_id);

create table workingTime
(
    id               int auto_increment
        primary key,
    free_time        int      default 0                 not null,
    is_shift         int      default 0                 not null,
    shift_name       varchar(255)                       null,
    is_night_shift   int      default 0                 not null,
    is_specific      int      default 0                 null,
    month            int                                null,
    date             longtext                           null,
    start_time       time                               null,
    end_time         time                               null,
    is_break         int      default 0                 not null,
    break_start_time time                               null,
    break_end_time   time                               null,
    companyId        int                                not null,
    employeeId       longtext                           null,
    created_at       datetime default CURRENT_TIMESTAMP null
);

