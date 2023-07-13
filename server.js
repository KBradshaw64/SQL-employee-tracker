const mysql = require('mysql2');
const inquirer = require('inquirer');
const fs = require('fs')
const util = require('util');
const { async } = require('rxjs');

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
);

db.query = util.promisify(db.query);

const questions = [
    {
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit'],
        name: 'directory'
    }
];

async function menu(){
    await inquirer.prompt(questions)
    .then(response => {
        if (response.directory === 'View All Employees'){
            viewAllEmployees();
        } else if (response.directory === 'Add Employee'){
            addEmployee();
        } else if (response.directory === 'Update Employee Role'){
            updateEmpRole();
        } else if (response.directory === 'View All Roles'){
            viewAllRole();
        } else if (response.directory === 'Add Role'){
            addRole();
        } else if (response.directory === 'View All Departments'){
            viewAllDep();
        } else if (response.directory === 'Add Department'){
            addDepartment();
        } else if (response.directory === 'Quit'){
            db.close();
        };
    });
};

menu();

async function viewAllEmployees(){
    const sql = `SELECT employee.id, employee.first_name AS "first name", employee.last_name 
                    AS "last name", emp_role.title, departments.name AS department, emp_role.salary, 
                    concat(manager.first_name, " ", manager.last_name) AS manager
                    FROM employee
                    LEFT JOIN emp_role
                    ON employee.role_id = emp_role.id
                    LEFT JOIN departments
                    ON emp_role.department_id = departments.id
                    LEFT JOIN employee manager
                    ON manager.id = employee.manager_id`
    const employees = await db.query(sql)
    console.table(employees);
    menu();
};

async function addEmployee(){
    const roles = await db.query(`select id as value, title as name from emp_role`)
    const employees = await db.query(`select id as value, concat(first_name, " ", last_name) as name from employee`)
    const responses = await inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: "What is the employee's first name?"
        },
        {
            type: 'input',
            name: 'lastName',
            message: "What is the employee's last name?"
        },
        {
            type: 'list',
            name: 'roleId',
            message: "What is the employee's role?",
            choices: roles
        },
        {
            type: 'list',
            name: 'managerId',
            message: "Who is the employee's manager?",
            choices: employees
        }
    ]);
    await db.query(`insert into employee(first_name, last_name, role_id, manager_id) values(?,?,?,?)`,[responses.firstName, responses.lastName, responses.roleId, responses.managerId])
    console.log('Success')
    menu();
};

async function updateEmpRole(){
    const roles = await db.query(`select id as value, title as name from emp_role`);
    const departments = await db.query(`selct id as value, name as name from departments`);
    //maybe cant use await with inquirer.prompt
    const responses = await inquirer.prompt([
        {
            type: 'list',
            name: 'roleId',
            message: "Which role would you like to update?",
            choices: roles
        },
        {
            //look for integer option
            type: 'number',
            name: 'newSal',
            message: "What is the salary of this role?"
        },
        {
            type: 'list',
            name: 'depId',
            message: 'What department is this role under?',
            choices: departments
        },
    ])
    //look up how to update multiple values in the same command
    await db.query(`update emp_role set salary = ?, department_id = ? where id = ?;`, [responses.newSal, responses.depId, responses.roleId])
    menu();
};

async function viewAllRole(){
    const sql = `select * from emp_role`
    const roles = await db.query(sql)
    console.table(roles);
    menu();
};

async function addRole(){
    const departments = await db.query(`selct id as value, name as name from departments`);
    const responses = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: "What is the title of the new role?"
        },
        {
            type: 'number',
            name: 'salary',
            message: "What is the salary for the new role?"
        },
        {
            type: 'list',
            name: 'department',
            message: "What department in the new role under?",
            choices: departments
        }
    ]);
    await db.query(`insert into emp_role(title, salary, department_id) values(?,?,?)`, [responses.title, responses.salary, responses.department])
    menu();
}

async function viewAllDep(){
    const sql = `select * from departments`
    const departments = await db.query(sql);
    console.table(departments);
    menu();
};

async function addDepartment(){
    const responses = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: "What is the name of the new Department?"
        },
    ]);
    await db.query(`inset into departments(name) values(?)`, [responses.name])
    menu();
};