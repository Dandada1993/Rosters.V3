let locID = null,
    locationName = '',
    weekstarting = null,
    weekending = null,
    sections = null,
    employees = null,
    sections_loaded = false,
    employees_loaded = false,
    rownum = 0;

function incrementRowum() {
    rownum++;
}

function getLocIDandWeekStarting(){
    locID = $('#selectlocations-dropdown').val();
    locationName = $('#selectlocations-dropdown option:selected').text();
    //console.log(locID);
    weekending = moment($('#weekending-input').val(), "MM/DD/YYYY");
    weekstarting = moment($('#weekending-input').val(), "MM/DD/YYYY").subtract(6, 'days').format('YYYY-MM-DD');
    //console.log(weekstarting);
};

function callAsyncGET(url, success, failure) {
    $.ajax({url:url}).done(success).fail(failure);
}

function loadRosterSections(){
    let url = 'getsections.php?locID=' + locID + '&weekstarting=' + weekstarting;
    let success = function(results) {
        sections = results;
        //console.log(sections);
        sections_loaded = true;
        addRosterElements();
    };
    let failure = function() {
        console.log('Loading roster sections failed');
    };
    callAsyncGET(url, success, failure);
}

function loadRosterEmployees(){
    let url = 'getemployees.php?locID=' + locID + '&weekstarting=' + weekstarting;
    let success = function(results) {
        employees = results;
        // console.log(employees);
        employees_loaded = true;
        addRosterElements();
    };
    let failure = function() {
        console.log('Loading roster sections failed');
    };
    callAsyncGET(url, success, failure);
}

function addTable() {
    return $('<table />');
}

function addTBody() {
    return $('<tbody />');
}

function addColumn(options) {
    return $('<td />', options);
}

function addDiv(options) {
    return $('<div />', options);
}

function addSpan(options) {
    return $('<span />', options);
}

function addRosterColumns(parent, values) {
    let result = addRow({ class: 'row', 'data-row' : rownum }).appendTo(parent);
    for(let key in values)
    {
        result.append(addColumn(values[key]));
    }
    incrementRowum();
}

function addRow(options) {
    return $('<tr />', options);
}

function addHeaders() {
    let main = $('#main');
    let colnum = 1;
    addRosterColumns(addTBody().appendTo(addTable().appendTo(main)), 
    [
        { html: '&nbsp;', class: 'col rowheader', 'data-col' : colnum++},
        { html: 'Name', class: 'col header name', 'data-col' : colnum++},
        { html: 'Position', class: 'col header position', 'data-col' : colnum++},
        { html: 'Wednesday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Thursday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Friday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Saturday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Sunday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Monday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Tuesday', class: 'col header shift', 'data-col' : colnum++},
        { html: 'Hours', class: 'col header hours', 'data-col' : colnum++}
    ]);
}

function addSections() {
    let main = $('#main');
    for(section of sections){
        addDiv({
            class : 'title',
            html : section.name
        }).appendTo(
            addDiv({
                class: 'section',
                'data-sectionid': section.id
            }).appendTo(main));
    }
}

function addEmployeeToSection(section, employee) {
    let colnum = 1;
    addRosterColumns(section, [
        { html: rownum, class: 'col rowheader', 'data-col' : colnum++, 'data-emp_no' : employee.emp_no},
        { html: `${employee.emp_fname} ${employee.emp_lname}`, class: 'col name', 'data-col' : colnum++},
        { html: `${employee.defaultQualifier} ${employee.defaultPosition}`, class: 'col position', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col shift', 'data-col' : colnum++},
        { class: 'col hours', 'data-col' : colnum++}    
    ]);
}

function addEmployeesToSection(sectionid, employees) {
    let section_selector = `.section[data-sectionid="${sectionid}"]`;
    let section = $(section_selector);
    let target_selector = `${section_selector} .details table tbody`;
    let target = $(target_selector);
    if (target.length === 0) {
        let section_div = addDiv({ class : 'details'}).appendTo(section);
        target = addTBody().appendTo(addTable().appendTo(section_div));
    }
    for(let i = 0; i < employees.length; i++)
    {
        addEmployeeToSection(target, employees[i]);
    }
}

function getEmployeesForSection(sectionid) {
    let sectionEmployees = [];    
    for(employee of employees){
        if (employee.sectionDefID === sectionid)
        {
            sectionEmployees.push(employee);
        }
    }
    return sectionEmployees;
}

function addEmployees() {
    $('.section').each(function(){
        let me = $(this),
            sectionid = me.attr('data-sectionid');
        let sectionEmployees = getEmployeesForSection(sectionid);
        addEmployeesToSection(sectionid, sectionEmployees);
    });
}

function addInputs() {
    $('.shift:not(.header').append($('<input>', {
        type : 'text',
        class : 'shift-input'
    }));
}

function addRosterElements(){
    if (sections_loaded && employees_loaded)
    {
        addHeaders();
        addSections();
        addEmployees();
        addInputs();
    }
}

function Shift(shiftString) {
    if (!new.target) { // if you run me without new
        return new Shift(shiftString); // ...I will add new for you
    };

    parse(shiftString);

    this.Date = null; //Should be private with a public getting and setter
    this.StartTime = null; //Should be private with a public getting and setter
    this.EndTime = null; //Should be private with a public getting and setter
    this.Position = null; //Should be private with a public getting and setter
    this.Qualifier = null; //Should be private with a public getting and setter
    this.Comment = null; //Should be private with a public getting and setter

    let isValid = false;

    let parse = function(shiftstring) {
        console.log('Attempting to parse string');
    };

    Object.defineProperty(this, 'isValid', {
        get: function() {
            return isvalid;
        }
    });
}

$(function () {
    $('#weekending').datepicker({
        daysOfWeekDisabled: "0,1,3,4,5,6",
        autoclose: true
    });
    $('#selectLocations-dialog').modal('show');
    $('#selectLocations-dialog').on('shown.bs.modal', function () {
        $('#selectlocations-dropdown').focus()
    });
    $('#selectlocations-button').on('click', function(){
        $('#selectLocations-dialog').modal('hide');
        getLocIDandWeekStarting();
        $('#top h2').html(`${locationName} (weekending: ${weekending.format('dddd MMMM DD, YYYY')})`);
        loadRosterSections();
        loadRosterEmployees();
    });
});