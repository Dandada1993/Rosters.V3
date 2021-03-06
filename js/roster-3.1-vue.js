

$(function () {
    $('#weekending').datepicker({
        daysOfWeekDisabled: "0,1,3,4,5,6",
        autoclose: true
    });
    $('#selectLocations-dialog').modal('show');
    $('#selectLocations-dialog').on('shown.bs.modal', function () {
        $('#selectlocations-dropdown').focus()
    });
});

function hideModal() {
    $('#selectLocations-dialog').modal('hide');
}

function getWeekending() {
    return $('#weekending-input').val();
}

function showSelectEmployeeModal() {
    $('#selectemployee-dialog').modal('show');
}

function hideSelectEmployeeModal() {
    $('#selectemployee-dialog').modal('hide');
}

let patterns = { 
    excudecode: '^(off(?:\\s?\\(r\\))?|vac|sl|il|cl)$',
    times: '(^(?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)\\s*-\\s*((?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)',
    location: '(?:(?:\\s+)@([a-z]{3,4}))',
    position: '(?:(?:\\s+)(#?(?:rest|barn|dtru)?)?\\s?(cr|fc|pr|su|cl)?)',
    time: '^(0?\\d|1(?:0|1|2))((?:(\\:)?)((?:0|3)0))?\\s*((?:a|p)m?)',
    qualifier: '(rest|barn|dtru)',
    comment: '**[A-Za-z\\s/]'
};

function Shift(date, shift) {
    if (!new.target) {
        return new Shift(date, shift);
    }

    let _date = date; //Should be private with a public getting and setter
    let _startTime = null; //Should be private with a public getting and setter
    let _endTime = null; //Should be private with a public getting and setter
    let _location = '';
    let _position = ''; //Should be private with a public getting and setter
    let _qualifier = ''; //Should be private with a public getting and setter
    let _comment = ''; //Should be private with a public getting and setter
    this.isValid = false;

    let parse = function() {
        let times = getTime(shift);
        _startTime = new moment(`${_date.format('YYYY-MM-DD')} ${times.start}`, 'YYYY-MM-DD hh:mm a');
        _endTime = new moment(`${_date.format('YYYY-MM-DD')} ${times.end}`, 'YYYY-MM-DD hh:mm a');
        if (_endTime.diff(_startTime) < 0) {
            _endTime.add(1, 'days');
        }
        _location = getLocation(shift);
        //_position = getPosition(shift);
        //_qualifier = getQualifier(shift);
        //_comment = getComment(shift);
        this.isValid = true;
    }

    let properTime = function (value) {
        //input must be minimally \da or \dp
        let regex = new RegExp(patterns.time, 'i'),
            result = regex.exec(value),
            hours = result[1].startsWith('0') ? result[1].replace('0', '') : result[1],
            minutes = typeof(result[4]) === "undefined" ? "00" : result[4],
            period = result[5].length === 1 ? result[5] + "m" : result[5];
        return (hours + ':' + minutes + period);
    }
            
    let getTime = function (value) {
        let regex = new RegExp(patterns.times, 'i');
        let result = getMatches(regex, value);
        return { start: properTime(result[1]), end: properTime(result[3]) };
    }

    let hasLocation = function (value) {
        let regex = new RegExp(patterns.location, 'i');
        return hasMatch(regex, value);
    }

    let getLocation = function(value) {
        let regex = new RegExp(patterns.location, 'i');
        return getMatches(regex, value);
    }

    let hasPosition = function(value) {
        let regex = new RegExp(patterns.position, 'i');
        return hasMatch(regex, value);
    }

    let getPosition = function(value) {
        let regex = new RegExp(patterns.position, 'i');
        let matches = getMatches(regex, value);

    }

    let hasQualifier = function(value) {
        let regex = new RegExp(patterns.qualifier, 'i');
        return hasMatch(regex, value);
    }

    let getQualifier = function(value) {
        let regex = new RegExp(patterns.qualifier, 'i');
        return getMatches(regex, value);
    }

    let hasMatch = function(regex, value) {
        return regex.test(value)
    }

    let getMatches = function(regex, value) {
        return regex.exec(value);
    }

    this.format = function(format) {
        let retval = `${_startTime.format('h:mm a')} - ${_endTime.format('h:mm a')}`;
        if (format === 'short'){
            retval = retval.replace(/(:00)/g, '').replace(/\s/g, '');
        } else if (format == 'extrashort') {
            retval = retval.replace(/(:00)/g, '').replace(/\s/g, '').replace(/M/gi, '');
        }
        if (_location) {
            retval += ` @${_location}`;
        }
        return retval.toUpperCase();
    }

    this.hours = function(){
        let minutes = _endTime.diff(_startTime, 'minutes');
        if (minutes > 240) {
            minutes -= 30;
        }
        return minutes/60;
    } 

    parse();
}

function Schedule(date) {
    if (!new.target) { // if you run me without new
        return new Schedule(date); // ...I will add new for you
    };

    this.date = date;
    this.shiftstring = '';

    function isExcuseCode(value) {
        var regex = new RegExp(patterns.excudecode, 'i');
        return regex.test(value);
    }

    function isTimes(value) {
        var regex = new RegExp(patterns.times, 'i');
        if (typeof value !== undefined) {
            return regex.test(value);
        }
        return false;
    }

    this.format = function(format) { 
        var retval = this.shiftstring;
        if (isTimes(this.shiftstring)){
            retval = '';
            let parts = this.shiftstring.split('/')
            for(part of parts) {
                let shift = new Shift(this.date, part)
                if (retval !== '') {
                    retval += '/';
                }
                retval += shift.format(format);
            }
        }
        return retval.toUpperCase();
    }

    this.hours = function() {
        var retval = 0;
        if (this.shiftstring !== undefined) {
            let parts = this.shiftstring.split('/')
            for(part of parts) {
                if (isTimes(part)) {
                    let shift = new Shift(this.date, part)
                    retval += shift.hours();
                }
            }
        }
        return retval;
    }

    this.isValid = function() {
        return (this.shiftstring === '') || isExcuseCode(this.shiftstring) || isTimes(this.shiftstring);
    }

    this.isEmpty = function() {
        if (this.shiftstring) {
            return false;
        }
        return true;
    }
}

let rostershift = {
    props: ['schedule'],
    template: `<input type="text"
                spellcheck="false"
                class="shift-input"  
                :class="{missing :schedule.isEmpty(), invalid :!schedule.isValid()}"
                v-model="schedule.shiftstring"
                v-on:focusin="$emit('focusin')" 
                v-on:focusout="$emit('focusout')"   
                v-on:change="valueChanged()"
                v-on:keyup.enter="valueChanged()"/>`, 
    data: function() {
        return {
            shortcuts: {
                o: 'OFF',
                or: 'OFF (R)',
                s: 'SL',
                i: 'IL'
            }
        }
    },
    methods: {
        valueChanged: function() {
            for(let key in this.shortcuts){
                if (this.schedule.shiftstring === key) {
                    this.schedule.shiftstring = this.shortcuts[key];
                    break;
                }
            }
            if (this.schedule.isValid()){
                this.schedule.shiftstring = this.schedule.format('short');
            }
            this.$emit('cellchanged');
        }
    }
}

let rostershiftcell = {
    props: ['schedule'],
    template: `<td 
                class="col shift" 
                :class="{active :isActive}" >
                    <rostershift 
                        :schedule="schedule"
                        v-on:focusin="isActive = true" 
                        v-on:focusout="isActive = false"
                        v-on:cellchanged="$emit('update-hours')">
                    </rostershift>
                </td>`,
    components: {
        'rostershift' : rostershift
    },
    data: function() {
        return {
            isActive : false
        }
    }
}

let positionselector = {
    props: ['employee','positions','hasqualifier'],
    template: `<td class="col position">
                    <select v-model="selected">
                        <option 
                            v-for="(position, index) in positions" 
                            :key="index"
                            :value="position">{{position}}</option>
                    </select>
               </td>`,
    data: function() {
        return {
            selected: this.defaultPosition()
        }
    },
    watch: {
        selected: function(newValue, oldValaue) {
            let parts = newValue.split(' ');
            if (parts.length === 2) {
                this.employee.defaultQualifier = parts[0];
                this.employee.defaultPosition = parts[1];
            }else{
                this.employee.defaultPosition = parts[0];
            }
        }
    },
    methods: {
        defaultPosition: function() {
            let position = this.employee.defaultPosition;
            if (this.employee.defaultQualifier !== null && this.hasqualifier === 1){
                position = `${this.employee.defaultQualifier} ${position}`;
            }
            return position;
        }
    }
}

let rosterslot = {
    props: ['employee', 'employeeindex','hasqualifier', 'positions'],
    data: function() {
        return {
            schedules : this.employee.schedules,
            positionqualifiers: [],
            hours: 0
        }
    },
    template: `<tr>
                <td class="col rowheader">
                    <span class="rownumber">{{employeeindex + 1}}</span>
                    <span class="deleterow">
                        <button 
                            type="button" 
                            class="btn btn-xs" 
                            v-on:click="emitDeleteEmployee()"
                            tabindex="-1">-
                        </button>
                    </span>
                </td>
                <td 
                    class="col name" 
                    :class="{invalid :nameNotSet}"
                    v-on:dblclick="$emit('select-employee', employeeindex)"
                >{{fullname}}</td>
                <positionselector 
                    :employee="employee" 
                    :positions="positions"
                    :hasqualifier="hasqualifier">
                </positionselector>
                <rostershiftcell 
                    v-for="(schedule, index) in schedules" 
                    :schedule="schedule" 
                    :key="index"
                    :data-row="employeeindex + 1"
                    :data-col="index + 1"
                    v-on:update-hours="updatehours()">
                </rostershiftcell>
                <td class="col hours number">{{hours}}</td>
               </tr>`,
    components: {
       'rostershiftcell' : rostershiftcell,
       'positionselector' : positionselector
    },
    computed: {
        fullname: function() {
            return `${this.employee.emp_fname} ${this.employee.emp_lname}`;
        },
        position: function() {
            let position = this.employee.defaultPosition;
            if (this.employee.defaultQualifier !== null && this.hasqualifier === 1){
                position = `${this.employee.defaultQualifier} ${position}`;
            }
            return position;
        },
        nameNotSet: function() {
            if (this.fullname.trim() === '')
                return true;
            return false;
        }
    },
    methods: {
        noMissingCells: function() {
            let nomissingcells = 0;
            for(let key in this.schedules) {
                if (this.schedules[key].isEmpty()) {
                    nomissingcells += 1;
                }
            }
            return nomissingcells;
        },
        noInvalidCells: function() {
            let noinvalidcells = 0;
            for(let key in this.schedules) {
                if (!this.schedules[key].isValid()) {
                    noinvalidcells += 1;
                }
            }
            if (this.fullname.trim() === '') {
                noinvalidcells += 1;
            }
            return noinvalidcells;
        },
        updatehours: function() {
            this.hours = 0;
            for(let key in this.schedules) {
                this.hours += this.schedules[key].hours();
            }
            this.employee.hours = this.hours;
            this.employee.noMissingCells = this.noMissingCells();
            this.employee.noInvalidCells = this.noInvalidCells();
            this.$emit('hours-updated');
        },
        emitDeleteEmployee: function() {
            this.$emit('delete-employee', this.employeeindex);
        }
    },
    mounted() {
        this.updatehours();
    }
}

let rostersection = {
    props: ['section', 'employees', 'qualifiers', 'positions'],
    template: `<div class="section" v-bind:data-sectionID="section.id">
                <div class="title">{{section.name}}
                    <span>
                        <button 
                            type="button" 
                            class="btn btn-sm btn-add" 
                            v-on:click="emitAddEmployee()"
                            tabindex="-1">Add
                        </button>
                    </span>
                </div>
                <table class="details">
                    <tbody>
                        <rosterslot 
                            class="rosterrow" 
                            v-for="(employee, index) in employees"
                            v-if="employee.sectionDefID === section.id" 
                            :employee="employee" 
                            :key="index"
                            :employeeindex="index"
                            :positions="positions"
                            :hasqualifier = "hasQualifier"
                            v-on:hours-updated="hoursUpdated()"
                            v-on:delete-employee="emitDeleteEmployee"
                            v-on:select-employee="emitSelectEmployee">
                        </rosterslot>
                    </tbody>
                </table>
               </div>`,
    components: {
        'rosterslot' : rosterslot
    },
    computed: {
        hasQualifier: function() {
            if (this.qualifiers.length > 0) {
                return 1;
            }
            return 0;
        }
    },
    methods: {
        emitAddEmployee: function() {
            this.$emit('add-employee', this.section);
        },
        emitDeleteEmployee: function(index) {
            this.$emit('delete-employee', index);
        },
        emitSelectEmployee: function(index) {
            this.$emit('select-employee', index);
        },
        hoursUpdated: function() {
            this.$emit('hours-updated');
        }
    }
}

let selectemployee = {
    props: ['deletedemployees', 'otheremployees'],
    data: function() {
        return {
            searchText: '',
            selectedEmployee: null
        }
    },
    template: `<div id="selectemployee-dialog" class="modal fade" tabindex=-1 role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                <h4 class="modal-title">Select an employee</h4>
                                <h5 class="modal-title">Double click to select</h5>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <input type="text" v-model="searchText">
                                    <ul>
                                        <li 
                                            class="local"
                                            v-for="employee in deletedemployees" 
                                            v-if="deletedemployees.length > 0"
                                            v-show="matchesSearch(employee)"
                                            v-on:dblclick="employeeDblClicked(employee)">{{fullnameandnumber(employee)}}</li>
                                        <li 
                                            v-for="other in otheremployees"
                                            v-if="otheremployees.length > 0"
                                            v-show="matchesSearch(other)"
                                            v-on:dblclick="visitingEmployeeDblClicked(other)">{{fullnameandnumber(other)}}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
               </div>`,
    methods: {
        fullname: function(employee) {
            return `${employee.emp_fname} ${employee.emp_lname}`;
        },
        fullnameandnumber: function(employee) {
            return `${employee.emp_fname} ${employee.emp_lname} (${employee.emp_no})`;
        },
        matchesSearch: function(employee) {
            let fullname = this.fullname(employee);
            return fullname.toLowerCase().includes(this.searchText.toLowerCase());
        },
        employeeDblClicked: function(employee) {
            //console.log(`employee double clicked ${employee.emp_no}`);
            this.selectedEmployee = employee;
            this.emitEmployeeSelected(employee);
        },
        visitingEmployeeDblClicked: function(employee) {
            //console.log(`visiting employee double clicked ${employee.emp_no}`);
            employee.visitor = true;
            this.employeeDblClicked(employee);
        },
        emitEmployeeSelected: function(employee) {
            this.searchText = '';
            this.$emit('employee-selected', employee);
        }
     }
}

const app = new Vue({
    el: '#main',
    data: {
        locations: null,
        sections : null,
        employees: null,
        positionQualifiers: null,
        location: null,
        locID: null,
        weekending: null,
        weekstarting: null,
        positions: [],
        nomissingcells: 0,
        noinvalidcells: 0,
        totalhours: 0,
        agreedhours: 0,
        deletedemployees: [],
        otheremployees: [],
        editEmployeeIndex: -1
        // additionalhours: 0
    },
    components: {
        'rostersection' : rostersection,
        'selectemployee' : selectemployee
    },
    watch: {
        location: function(newval, oldval){
            if (newval) {
                this.loadPositionQualifiers();
                this.loadEmployees();
                this.loadSections();
                this.loadAllocatedHours();
                this.loadPositions();
                this.loadOtherEmployees();
            }
        },
        employees: function(newval, oldval) {
            if (newval) {
                for(employee of this.employees) {
                    employee.schedules = this.createSchedules();
                }
            }
        }
    },
    computed: {
        difference: function() {
            return this.agreedhours - this.totalhours;
        },
        weekendingDisplay: function() {
            return moment(this.weekending, 'MM/DD/YYYY').format('dddd MMMM DD, YYYY');
        }
    },
    methods: {
        updatestats: function() {
            //console.log("updating stats");
            if (this.employees) {
                this.nomissingcells = 0;
                this.noinvalidcells = 0;
                for(employee of this.employees) {
                    if(employee.noMissingCells) {
                        this.nomissingcells += employee.noMissingCells;
                    }
                    if(employee.noInvalidCells) {
                        this.noinvalidcells += employee.noInvalidCells;
                    }
                }
            }
        },
        deleteEmployee: function(index) {
            //console.log('calling row deleted.')
            //this.showRowNumbers();
            let target = this.employees[index];
            if (target.emp_no) {  //if emp_no has not been assigned must be a blank row so ignore
                if (target.visitor) {
                    this.otheremployees.push(target)
                    this.otheremployees.sort(this.sortEmployees);
                } else {
                    this.deletedemployees.push(target);
                    this.deletedemployees.sort(this.sortEmployees);
                }
            }
            this.employees.splice(index, 1); //remove employee
            this.updatestats();
        },
        hoursUpdated: function() {
            this.totalhours = 0;
            if (this.employees) {
                for(employee of this.employees) {
                    if(employee.hours) {
                        this.totalhours += employee.hours;
                    }
                }
            }
            this.updatestats();
        },
        weekDate: function(day) {  //wed: 1, tue: 7
            let noofdays = day - 7;
            return moment(this.weekending, 'MM/DD/YYYY').add(noofdays, 'days');
        },
        createSchedule: function(weekDate) {
            let schedule = new Schedule(weekDate);
            //schedule.shiftstring = '05:00 AM - 02:00 PM';
            return schedule;
        },
        createSchedules: function() {
            return [ 
                this.createSchedule(this.weekDate(1)), //new Schedule(this.employee, weekDate(1),'05:00 AM - 02:00 PM'),
                this.createSchedule(this.weekDate(2)),
                this.createSchedule(this.weekDate(3)),
                this.createSchedule(this.weekDate(4)),
                this.createSchedule(this.weekDate(5)),
                this.createSchedule(this.weekDate(6)),
                this.createSchedule(this.weekDate(7))
            ]
        },
        getAddIndex: function(sectionid) {
            let addindex = this.employees.length;
            let found = false;
            for(let i = 0; i < this.employees.length; i++) {
                if (this.employees[i].sectionDefID === sectionid) {
                    found = true;
                }
                if (found){
                    if (this.employees[i].sectionDefID !== sectionid) {
                        addindex = i;
                        break;
                    }
                }
            }
            return addindex;
        },
        addEmployee: function(section) {
            let newemployee = {
                emp_no: '',
                emp_fname: '',
                emp_lname: '',
                gender: '',
                defaultPosition: section.defaultPosition,
                defaultQualifier: this.location.defaultQualifier,
                sectionDefID: section.id,
                defaultLocation: ''
            }
            newemployee.schedules = this.createSchedules();
            let addindex = this.getAddIndex(section.id);
            //this.employees.push(newemployee);
            this.employees.splice(addindex, 0, newemployee);
        },
        getQualifiers: function(position) {
            let qualifiers = [];
            for(let key in this.positionQualifiers) {
                if (this.positionQualifiers[key].Code === position) {
                    qualifiers.push(this.positionQualifiers[key]);
                }
            }
            return qualifiers;
        },
        loadSections: function() {
            let url = `getsections.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.sections = json;
            })
        },
        loadEmployees: function() {
            let url = `getemployees.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.employees = json;
            })
        },
        loadPositionQualifiers: function() {
            let url = `getpositionqualifiers.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.positionQualifiers = json;
            })
        },
        loadAllocatedHours: function() {
            let url = `getallocatedhours.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.agreedhours = parseFloat(json[0].allocatedhours); //json;
            })
        },
        loadPositions: function() {
            let url = `getpositions.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.extractPositions(json);
            })
        },
        loadOtherEmployees: function() {
            let url = `getotheremployees.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                if (json) {
                    this.otheremployees = json;
                }
            })
        },
        extractPositions: function(positionsarray) {
            this.positions = [];
            for(let i = 0; i < positionsarray.length; i++) {
                this.positions.push(positionsarray[i].position);
            }
        },
        locationChanged: function(event) {
            //console.log(event.target.value);
            this.locID = event.target.value;
        },
        modalOKClicked: function(event) {
            this.weekending = getWeekending();
            if (this.weekending) {
                this.weekstarting = moment(this.weekending, "MM/DD/YYYY").subtract(6, 'days');
            }
            if (this.locID && this.weekending) {
                for(let location of this.locations) {
                    if (location.locID === this.locID) {
                        this.location = location;
                        break;
                    }
                }
                hideModal();
            }
        },
        selectEmployee: function(index) {
            this.editEmployeeIndex = index;
            if (this.deletedemployees.length > 0 || this.otheremployees.length > 0) {
                showSelectEmployeeModal();
            }
        },
        employeeSelected: function(employee) {
            //console.log('Employee selected');
            hideSelectEmployeeModal();
            this.employees[this.editEmployeeIndex].emp_no = employee.emp_no;
            this.employees[this.editEmployeeIndex].emp_fname = employee.emp_fname;
            this.employees[this.editEmployeeIndex].emp_lname = employee.emp_lname;
            if (employee.visitor) {
                this.employees[this.editEmployeeIndex].visitor = true;
                this.removeEmployee(this.otheremployees, employee);
            } else {
                this.removeEmployee(this.deletedemployees, employee);
            }
            this.editEmployeeIndex = -1;
            this.updatestats();
        },
        removeEmployee: function(list, employee) {
            let index = -1;
            for(let i = 0; i < list.length; i++) {
                if (list[i].emp_no === employee.emp_no) {
                    index = i;
                    break;
                }
            }
            list.splice(index, 1);
        },
        sortEmployees: function(empA, empB) {
            var nameA = `${empA.emp_fname} ${empA.emp_lname}`.toUpperCase(); // ignore upper and lowercase
            var nameB = `${empB.emp_fname} ${empB.emp_lname}`.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
          
            // names must be equal
            return 0;
        },
        highlightCell(row, col) {
            this.$el.querySelector(`.shift[data-row="${row}"][data-col="${col}"] input`).classList.add('highlight');
        },
        unhighlightCell(row, col) {
            this.$el.querySelector(`.shift[data-row="${row}"][data-col="${col}"] input`).classList.remove('highlight');
        },
        highlightCells(startrow, startcol, endrow, endcol){
            for(let i = startrow; i <= endrow; i++){
                for(let j = startcol; j <= endcol; j++) {
                    this.highlightCell(i, j);
                }
            }
        },
        unhighlightAllCells() {
            let startrow = 1;
            let endrow = this.employees.length;
            let startcol = 1;
            let endcol = 7;
            for(let i = startrow; i <= endrow; i++){
                for(let j = startcol; j <= endcol; j++) {
                    this.unhighlightCell(i, j);
                }
            }
        }
    },
    created: function() {
        let url = `getlocations-2.php`;
        fetch(url)
        .then(response => response.json())
        .then(json => {
            this.locations = json;
        })
    }
    // updated: function(){
    //     this.$nextTick(function() {
    //         this.showRowNumbers();
    //     })
    // }
})