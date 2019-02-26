let data = {
    employees: [],
    location: null
}

const EventBus = new Vue();

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

function showShiftEntryModal() {
    $('#shiftentry-dialog').modal('show');
    // $('#starttime').timepicker();
    // $('#endtime').timepicker();
}

function hideShiftEntryModal() {
    $('#shiftentry-dialog').modal('hide');
}

let patterns = { 
    excudecode: '^(off(?:\\s?\\(r\\))?|vac|sl|il|cl)$',
    times: '(^(?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)\\s*-\\s*((?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)',
    location: '(?:(?:\\s+)(?:@?)(~))', //'(?:(?:\\s+)@([a-z]{3,4}))'
    position: '(?:(?:\\s*)((?:#?)(rest|barn|dtru)?)?\\s?(cr|fc|pr|sr|cl|ck))',
    time: '^(0?\\d|1(?:0|1|2))((?:(\\:)?)((?:0|3)0))?\\s*((?:a|p)m?)',
    qualifier: '(rest|barn|dtru)',
    comment: '(?:\\*\\*)([A-Za-z\\s]+)'
};

let Validator = {
    isExcuse: function(value) {
        var regex = new RegExp(patterns.excudecode, 'i');
        return regex.test(value);
    },
    isTimes: function(value) {
        var regex = new RegExp(patterns.times, 'i');
        if (typeof value !== undefined) {
            return regex.test(value);
        }
        return false;
    },
    removeTimes: function(value) {
        var regex = new RegExp(patterns.times, 'i');
        return value.replace(regex, '');
    },
    hasLocation: function(value) {
        let regex = new RegExp(patterns.location, 'i');
        return regex.test(value);
    },
    removeLocation: function(value) {
        let regex = new RegExp(patterns.location, 'i');
        return value.replace(regex, '');
    },
    hasPosition: function(value) {
        let regex = new RegExp(patterns.position, 'i');
        return regex.test(value);
    },
    removePosition: function(value) {
        let regex = new RegExp(patterns.position, 'i');
        return value.replace(regex, '');
    },
    hasComment: function(value) {
        let regex = new RegExp(patterns.comment, 'i');
        return regex.test(value);
    },
    removeComment: function(value) {
        let regex = new RegExp(patterns.comment, 'i');
        return value.replace(regex, '');
    },
    properTime: function (value) {
        //input must be minimally \da or \dp
        let regex = new RegExp(patterns.time, 'i'),
            result = regex.exec(value),
            hours = result[1].startsWith('0') ? result[1].replace('0', '') : result[1],
            minutes = typeof(result[4]) === "undefined" ? "00" : result[4],
            period = result[5].length === 1 ? result[5] + "m" : result[5];
        return (hours + ':' + minutes + period);
    },            
    getTime: function (value) {
        let regex = new RegExp(patterns.times, 'i');
        let result = regex.exec(value);
        return { start: this.properTime(result[1]), end: this.properTime(result[3]) };
    },
    getLocation: function(value) {
        let regex = new RegExp(patterns.location, 'i');
        let result = regex.exec(value);
        if (result) {
            return result[1];
        } else {
            return '';
        }
    },
    getPosition: function(value) {
        let regex = new RegExp(patterns.position, 'i');
        let result = regex.exec(value);
        if (result) {
            let qualifier;
            let position;
            if (result[2]) {
                qualifier = result[2];
            }
            position = result[3];
            return { qualifier: qualifier, position: position }
        } else {
            return { qualifier:'', position:'' }
        }
    },
    getComment: function(value) {
        let regex = new RegExp(patterns.comment, 'i');
        let result = regex.exec(value);
        if (result) {
            return result[1];
        } else {
            return ''
        }
    },
    getShiftTimes: function(shift, date='2019-02-14') {
        let times = this.getTime(shift);
        let starttime = new moment(`${date} ${times.start}`, 'YYYY-MM-DD hh:mm a');
        let endtime = new moment(`${date} ${times.end}`, 'YYYY-MM-DD hh:mm a');
        if (endtime.diff(starttime) < 0) {
            endtime.add(1, 'days');
        }
        return { starttime: starttime, endtime: endtime};
    },
    validShift: function(value) {
        //9a-2p @ROC REST PR **PARTY
        if (this.isTimes(value)) {
            let remaining = this.removeTimes(value);
            if (this.hasLocation(remaining)) {
                remaining = this.removeLocation(remaining);
            }
            if (this.hasPosition(remaining)) {
                remaining = this.removePosition(remaining);
            }
            if (this.hasComment(remaining)) {
                remaining = this.removeComment(remaining);
            }
            if (remaining.trim()) {
                return false;
            }
            return true;
        } else if (this.isExcuse(value)) {
            return true;
        }
        return false;
    },
    validShifts: function(shiftstring) {
        let shifts = shiftstring.split('/');
        let valid = true;
        for(let i = 0; i < shifts.length; i++) {
            valid = valid && this.validShift(shifts[i]);
        }
        if (valid && shifts.length > 1) { //check that the shifts do not overlap
            let firstShift = this.getShiftTimes(shifts[0]);
            let secondShift = this.getShiftTimes(shifts[1]);
            if (secondShift.starttime.diff(firstShift.endtime) < 0) {
                valid = false;
            }
        }
        return valid;
    }
}

function Shift(date, shift = '') {
    if (!new.target) {
        return new Shift(date, shift);
    }

    let _date = date; 
    this.shift = shift;
    this.starttime = null; 
    this.endtime = null; 
    this.location = '';
    this.position = ''; 
    this.qualifier = ''; 
    this.comment = ''; 

    this.parse = function() {
        if (Validator.validShift(this.shift)) {
            let times = Validator.getTime(this.shift);
            this.starttime = new moment(`${_date.format('YYYY-MM-DD')} ${times.start}`, 'YYYY-MM-DD hh:mm a');
            this.endtime = new moment(`${_date.format('YYYY-MM-DD')} ${times.end}`, 'YYYY-MM-DD hh:mm a');
            if (this.endtime.diff(this.starttime) < 0) {
                this.endtime.add(1, 'days');
            }
            this.location = Validator.getLocation(this.shift);
            let result = Validator.getPosition(this.shift);
            this.qualifier = result.qualifier;
            this.position = result.position;
            this.comment = Validator.getComment(this.shift);
        }
    }

    this.hours = function(){
        if (this.starttime && this.endtime) {
            let minutes = this.endtime.diff(this.starttime, 'minutes');
            if (minutes > 240) {
                minutes -= 30;
            }
            return minutes/60;
        }
        return 0;
    } 

    this.format = function(format, options = {}) {
        if (this.starttime && this.endtime) {
            let retval = `${this.starttime.format('h:mm a')} - ${this.endtime.format('h:mm a')}`;
            if (format === 'short'){
                retval = retval.replace(/(:00)/g, '').replace(/\s/g, '');
            } else if (format == 'extrashort') {
                retval = retval.replace(/(:00)/g, '').replace(/\s/g, '').replace(/M/gi, '');
            }
            if (this.location && options.showlocation) {
                retval += ` @${this.location}`;
            }
            if (this.qualifier && options.showqualifier) {
                retval += ` #${this.qualifier}`
            }
            if (this.position && (options.showposition || options.showqualifier)) {
                retval += ` ${this.position}`
            }
            if (this.comment) {
                retval += ` **${this.comment}`
            }

            return retval.toUpperCase();
        }
        return '';
    }
}

function Schedule(date) {
    if (!new.target) { // if you run me without new
        return new Schedule(date); // ...I will add new for you
    };

    this.date = date;
    this.shiftstring = '';
    this.defaultLocation = '';
    this.defaultQualifier = '';
    this.defaultPosition = '';
    this.firstShift = null;
    this.secondShift = null;

    this.setShifts = function() {
        if (Validator.isTimes(this.shiftstring)) {
            let parts = this.shiftstring.split('/');
            this.firstShift = new Shift(this.date, parts[0]);
            this.firstShift.parse();
            if (parts.length === 2) {
                this.secondShift = new Shift(this.date, parts[1]);
                this.secondShift.parse();
                if (this.secondShift.location) {
                    if (!this.firstShift.location) {
                        this.firstShift.location = this.secondShift.location;
                    }
                } else {
                    this.secondShift.location = this.defaultLocation;
                    if (!this.firstShift.location) {
                        this.firstShift.location = this.secondShift.location;
                    }
                }
                if (this.secondShift.qualifier) {
                    if (!this.firstShift.qualifier) {
                        this.firstShift.qualifier = this.secondShift.qualifier;
                    }
                } else {
                    this.secondShift.qualifier = this.defaultQualifier;
                    if (!this.firstShift.qualifier) {
                        this.firstShift.qualifier = this.secondShift.qualifier;
                    }
                }
                if (this.secondShift.position) {
                    if (!this.firstShift.position) {
                        this.firstShift.position = this.secondShift.position;
                    }
                } else {
                    this.secondShift.position = this.defaultPosition;
                    if (!this.firstShift.position) {
                        this.firstShift.position = this.secondShift.position;
                    }
                }
            }
        }
    }

    this.isExcuse = function() {
        return Validator.isExcuse(this.shiftstring);
    }

    this.isTime = function() {
        return Validator.isTimes(this.shiftstring);
    }

    this.isSplit = function() {
        if (this.secondShift) {
            return true;
        }
        return false;
    }

    this.format = function(format) { 
        let retval = this.shiftstring;
        if (Validator.isTimes(this.shiftstring) || this.firstShift){
            if (!this.firstShift) {
                this.setShifts();
            }
            let firstShift_options = {};
            if (this.secondShift) {
                let secondShift_options = {};
                if (this.secondShift.location === this.firstShift.location) {
                    firstShift_options.showlocation = false;
                    if (this.secondShift.location === this.defaultLocation) {
                        secondShift_options.showlocation = false;
                    }
                    else {
                        secondShift_options.showlocation = true;
                    }
                } else {
                    if (this.firstShift.location !== this.defaultLocation) {
                        firstShift_options.showlocation = true;
                    }
                    if (this.secondShift.location !== this.defaultLocation) {
                        secondShift_options.showlocation = true;
                    }
                }
                if (this.secondShift.qualifier === this.firstShift.qualifier) {
                    firstShift_options.showqualifier = false;
                    if (this.secondShift.qualifier === this.defaultQualifier) {
                        secondShift_options.showqualifier = false;
                    }
                    else {
                        secondShift_options.showqualifier = true;
                    }
                } else {
                    if (this.firstShift.qualifier !== this.defaultQualifier) {
                        firstShift_options.showqualifier = true;
                    }
                    if (this.secondShift.qualifier !== this.defaultQualifier) {
                        secondShift_options.showqualifier = true;
                    }
                }
                if (this.secondShift.position === this.firstShift.position) {
                    firstShift_options.showposition = false;
                    if (this.secondShift.position === this.defaultPosition) {
                        secondShift_options.showposition = false;
                    }
                    else {
                        secondShift_options.showposition = true;
                    }
                } else {
                    if (this.firstShift.position !== this.defaultPosition) {
                        firstShift_options.showposition = true;
                    }
                    if (this.secondShift.position !== this.defaultPosition) {
                        secondShift_options.showposition = true;
                    }
                }
                retval = `${this.firstShift.format(format, firstShift_options)}/${this.secondShift.format(format, secondShift_options)}`;
            } else {
                if (this.firstShift.location !== this.defaultLocation) {
                    firstShift_options.showlocation = true;
                }
                if (this.firstShift.qualifier !== this.defaultQualifier) {
                    firstShift_options.showqualifier = true;
                }
                if (this.firstShift.position !== this.defaultPosition) {
                    firstShift_options.showposition = true;
                }
                retval = this.firstShift.format(format, firstShift_options);
            }
        }
        //return retval.toUpperCase();
        this.shiftstring = retval.toUpperCase();
    }

    this.hours = function() {
        var retval = 0;
        if (Validator.isTimes(this.shiftstring)){
            retval += this.firstShift.hours();
            if (this.secondShift) {
                retval += this.secondShift.hours();
            }
        }
        return retval;
    }

    this.isValid = function() {
        return this.isEmpty() || Validator.validShifts(this.shiftstring);
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
                :class="{missing :isEmpty, invalid :!isValid}"
                v-model.lazy="schedule.shiftstring"
                v-on:focusin="$emit('focusin')" 
                v-on:focusout="$emit('focusout')"   
                v-on:change="valueChanged()"
                v-on:keyup.enter="valueChanged()"
                v-on:dblclick="emitEnterShift(schedule)"/>`, 
    data: function() {
        return {
            //shiftstring: this.schedule.shiftstring,
            shortcuts: {
                o: 'OFF',
                or: 'OFF (R)',
                s: 'SL',
                i: 'IL'
            }
        }
    },
    computed: {
        isEmpty: function() {
            if (this.schedule.shiftstring) {
                return false;
            }
            return true;
        },
        isValid: function() {
            return this.isEmpty || Validator.validShifts(this.schedule.shiftstring);
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
            if (this.isValid){
                this.schedule.setShifts();
                this.schedule.format("short");
            }
            this.$emit('cellchanged');
        },
        emitEnterShift: function(schedule) {
            this.$emit('enter-shifts', schedule);
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
                        v-on:cellchanged="$emit('update-hours')"
                        v-on:enter-shifts="emitEnterShift">
                    </rostershift>
                </td>`,
    components: {
        'rostershift' : rostershift
    },
    data: function() {
        return {
            isActive : false
        }
    },
    methods: {
        emitEnterShift: function(schedule) {
            this.$emit('enter-shifts', schedule)
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
                    v-on:update-hours="updatehours()"
                    v-on:enter-shifts="emitEnterShift">
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
        },
        emitEnterShift: function(schedule) {
            this.$emit('enter-shifts', { schedule: schedule, employee: this.employee })
        }
    },
    mounted() {
        this.updatehours();
        EventBus.$on('CLOSED-SHIFTENTRYMODAL', () => {
            this.updatehours();
          })
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
                            v-on:select-employee="emitSelectEmployee"
                            v-on:enter-shifts="emitEnterShifts">
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
        },
        emitEnterShifts(data) {
            this.$emit('enter-shifts', data);
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
                                            v-on:dblclick="visitingEmployeeDblClicked(other)">{{fullnamenumberandposition(other)}}</li>
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
        fullnamenumberandposition: function(employee) {
            return `${employee.emp_fname} ${employee.emp_lname} (${employee.emp_no}) (${employee.position})`;
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

let timeentry = {
    props: {
        value: String,
        start: {
            type: String,
            default: '12:00 am'
        }
    }, 
    data: function() {
        return { 
                times: [],
                selectedvalue: this.value,
                startindex: 0
            }
    },
    watch: {
        value: function(newVal) {
            this.selectedvalue = this.value;
        },
        times: function(newVal) {
            this.startindex = this.times.indexOf(this.start);
        },
        start: function(newVal) {
            this.startindex = this.times.indexOf(this.start);
        }
    },
    template: `<select class="form-control" v-model="selectedvalue" v-on:change="emitTimeChanged">
                    <option value="" disabled >Select time</option>
                    <option v-for="(time, index) in times" :key="index" :value="time" v-if="index >= startindex">{{time}}</option>
               </select>`,
    methods: {
        emitTimeChanged: function() {
            this.$emit('time-changed', this.selectedvalue);
        },
        setStart: function(value) {
            this.start = value;
        }
    },
    created: function() {
        for(let i = 0; i < 48; i++) {
            let suffix = 'am';
            if (i >= 24) {
                suffix = 'pm';
            }
            let minutes = '00';
            let hour = i;
            if (i % 2 === 1) {
                minutes = '30';
                hour = i - 1;
            }
            hour = (hour / 2) % 12;
            if (hour === 0) {
                hour = 12
            }
            this.times.push(`${hour}:${minutes} ${suffix}`);
        }
    }
}

let shiftentry = {
    props: ['location', 'employee', 'schedule', 'locations', 'locationsqualifiers'],
    data: function() {
        return {
            showModal: 'none',
            localSchedule: this.createSchedule(this.schedule),
            locID: this.location.locID,
            page: 1,
            isSplit : false,
            errors: {
                starttime: false,
                endtime: false,
                position: false,
                has: function() {
                    if (this.starttime || this.endtime || this.position) {
                        return true;
                    }
                    return false;
                }
            }
        }
    },
    components: {
        'timeentry' : timeentry
    },
    watch: {
        locID: function(newVal, oldVal) {
            this.currentShift.location = newVal;
        },
        isSplit: function(newVal) {
            if (newVal) {
                if (!this.localSchedule.secondShift) {
                    this.localSchedule.secondShift = this.createShift();
                }
            } else {
                this.localSchedule.secondShift = null;
            }
        }
    },
    computed: {
        dateDisplay: function() {
            return this.localSchedule.date.format('dddd MMMM DD, YYYY');
        },
        fullname: function() {
            return `${this.employee.emp_fname} ${this.employee.emp_lname}`;
        },
        currentShift: function() {
            let shift;
            if (this.page === 1) {
                if (!this.localSchedule.firstShift) {
                    this.localSchedule.firstShift = this.createShift();
                }
                shift = this.localSchedule.firstShift;
            } else {
                if (!this.localSchedule.secondShift) {
                    this.localSchedule.secondShift = this.createShift();
                }
                shift = this.localSchedule.secondShift;
            }
            return shift;
        },
        currentPosition: {
            get: function() {
                if (this.page === 1) {
                    if (this.localSchedule.firstShift.position) {
                        return this.getShiftPosition(this.localSchedule.firstShift);
                    } else {
                        return this.getEmployeePosition();
                    }
                } else {
                    if (this.localSchedule.firstShift.position) {
                        return this.getShiftPosition(this.localSchedule.secondShift);
                    } else {
                        return this.getEmployeePosition();
                    }
                }
            },
            set: function(value) {
                //console.log(`Position changed to ${value}`);
                let result = Validator.getPosition(value);
                if (this.page === 1) {
                    this.localSchedule.firstShift.qualifier = result.qualifier;
                    this.localSchedule.firstShift.position = result.position;
                } else {
                    this.localSchedule.secondShift.qualifier = result.qualifier;
                    this.localSchedule.secondShift.position = result.position;
                }
                this.localSchedule.format('short');
            }
        },
        shiftstring: function() {
            this.localSchedule.format('short');
            return this.localSchedule.shiftstring;
        },
        isValid: function() {
            return Validator.validShifts(this.shiftstring);
        }
    },
    template: `<div id="shiftentry-dialog" class="modal fade" tabindex=-1 role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="reset"><span aria-hidden="true">&times;</span></button>
                                <h4 class="modal-title">Enter shift for {{fullname}}<span v-if="isSplit">&nbsp;(Shift {{page}} of 2)</span></h4>
                                <h5 class="modal-title">Date: {{dateDisplay}}</h5>
                                <span><h5 class="haserrors" v-show="errors.has()"><strong>The fields marked with an &#10033; are required</strong></h5></span>
                            </div>
                            <div class="modal-body">
                                <div v-if="(page===1 && (currentShift.starttime && currentShift.endtime)) || page===2">
                                    <p><span>Shift string:&nbsp;</span>{{shiftstring}}</p>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-6">
                                        <label for="location">Location</label>
                                        <select id="location" v-model="locID" class="form-control">
                                            <option v-for="loc in locations" v-if="loc.type === 'R' || loc.type === 'C'" :value="loc.locID">{{loc.name}}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-4" :class="{haserrors: errors.starttime}">
                                        <label for="starttime">Start Time<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <timeentry ref="starttime" id="starttime" :value="gettime(currentShift.starttime)" v-on:time-changed="setStartTime"/>
                                    </div>
                                    <div class="col-xs-4" :class="{haserrors: errors.endtime}">
                                        <label for="endtime">End Time<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <timeentry ref="endtime" id="endtime" :value="gettime(currentShift.endtime)" :start="gettime(currentShift.starttime)" v-on:time-changed="setEndTime"/>
                                    </div>
                                    <div class="col-xs-4">
                                        <label for="hours">Hours</label>
                                        <p v-if="(currentShift.starttime && currentShift.endtime) || page===2">{{localSchedule.hours()}}</p>
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-6">
                                        <label for="position" :class="{haserrors: errors.position}">Position<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <select id="position" v-model="currentPosition" class="form-control">
                                            <option value="" disabled>Select position</option>
                                            <option v-for="row in locationsqualifiers" v-if="row.locID===locID" :value="row.position">{{row.position}}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="comment">Comment</label>
                                    <input type="text" id="comment" class="form-control" v-model="currentShift.comment"/>
                                </div>
                                <div class="form-group">
                                    <input type="checkbox" id="issplit" v-model="isSplit">
                                    <label for="issplit">Is split shift?</label>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" data-dismiss="modal" v-on:click="reset">Close</button>
                                <button type="button" class="btn btn-default" v-on:click="gotoPageOne" v-if="isSplit && page===2">&lt; 1st shift</button>
                                <button type="button" class="btn btn-default" v-on:click="gotoPageTwo" v-if="isSplit && page===1">2nd shift &gt;</button>
                                <button type="button" class="btn btn-primary" v-on:click="selectshiftOkClicked" :disabled="!isValid">OK</button>
                            </div>
                        </div>
                    </div>
                </div>`,
    methods: {
        updateData: function(data) {
            this.localSchedule = this.createSchedule(data.schedule);
            this.locID = this.location.locID;
            if (this.page === 1) {
                if (data.schedule.firstShift) {
                    this.locID = data.schedule.firstShift.location;
                }
            } else {
                if (data.schedule.secondShift) {
                    this.locID = data.schedule.secondShift.location;
                }
            }
            this.validate();
        },
        createSchedule: function(source) {
            let localschedule = new Schedule(source.date);
            localschedule.firstShift = source.firstShift;
            localschedule.secondShift = source.secondShift;
            this.isSplit = source.isSplit();
            return localschedule;
        },
        isValidStartTime: function() {
            let result = true;
            if (this.currentShift.starttime) {
                this.errors.starttime = false;
            } else {
                result = false;
                this.errors.starttime = true;
            }
            return result;
        },
        isValidEndTime: function() {
            let result = true;
            if (this.currentShift.endtime) {
                this.errors.endtime = false;
            } else {
                result = false;
                this.errors.endtime = true;
            }
            return result;
        },
        isValidPosition: function () {
            let result = true;
            if (this.currentShift.position) {
                this.errors.position = false;
            } else {
                result = false;
                this.errors.position = true;
            }
            return result;
        },
        validate: function() {
            let isValid = this.isValidStartTime();
            isValid = this.isValidEndTime() && isValid;
            isValid = this.isValidPosition() && isValid;
            return isValid;
        },
        selectshiftOkClicked: function() {
            if (this.validate()) {
                hideShiftEntryModal();
                this.localSchedule.format('short');
                this.schedule.shiftstring = this.localSchedule.shiftstring;
                this.schedule.setShifts();
                this.schedule.format('short');
                EventBus.$emit('CLOSED-SHIFTENTRYMODAL');
                this.reset();
            }
        },
        gotoPageTwo: function() {
            //console.log('Go to page 2');
            if (this.validate()) {
                this.page = 2;
                this.resetErrors();
                this.validate();
            }
        },
        gotoPageOne: function() {
            //console.log('Go to page 1');
            if (this.validate()) {
                this.page = 1;
                this.resetErrors();
                this.validate();
            }
        },
        resetErrors: function() {
            this.errors.starttime = false;
            this.errors.endtime = false;
            this.errors.position = false;
        },
        gettime: function(moment) {
            if (moment) {
                return moment.format('h:mm a');
            } else {
                return '';
            }
        },
        setStartTime: function(time) {
            //console.log(`Start time: ${time}`);
            this.currentShift.starttime = new moment(`${this.schedule.date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD h:mm a');
            this.isValidStartTime();
        },
        setEndTime: function(time) {
            //console.log(`End time: ${time}`);
            this.currentShift.endtime = new moment(`${this.schedule.date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD h:mm a');
            if (this.currentShift.endtime.diff(this.currentShift.starttime) < 0) {
                this.currentShift.endtime.add(1, 'days');
            }
            this.isValidEndTime();
        },
        createShift: function() {
            let shift = new Shift(this.schedule.date);
            shift.location = this.location.locID;
            shift.qualifier = this.employee.defaultQualifier;
            shift.position = this.employee.defaultPosition;
            return shift;
        },
        reset: function() {
            //this.localSchedule = null;
            this.page = 1;
            this.isSplit = false;
        },
        hoursUpdated: function() {
            this.$emit('hours-updated');
        },
        getEmployeePosition: function() {
            let currentposition;
            if (this.employee.defaultQualifier) {
                currentposition = `${this.employee.defaultQualifier} ${this.employee.defaultPosition}`;
            } else {
                currentposition = this.employee.defaultPosition;
            }
            return currentposition;
        },
        getShiftPosition: function(shift) {
            let currentposition;
            if (shift.qualifier) {
                currentposition = `${shift.qualifier} ${shift.position}`;
            } else {
                currentposition = shift.position;
            }
            return currentposition;
        }
    },
    mounted () {
        EventBus.$on('SHOW-SHIFTENTRYMODAL', (data) => {
          this.updateData(data);
        })
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
        editEmployeeIndex: -1,
        editdata: null,
        locationsqualifiers: []
        // additionalhours: 0
    },
    components: {
        'rostersection' : rostersection,
        'selectemployee' : selectemployee,
        'shiftentry' : shiftentry
    },
    watch: {
        locations: function() {
            let pattern = '';
            for(let i = 0; i < this.locations.length; i++) {
                if (i > 0) {
                    pattern += '|';
                }
                pattern += this.locations[i].locID;
            }
            patterns.location = patterns.location.replace('~', pattern);
        },
        location: function(newval, oldval){
            if (newval) {
                this.loadPositionQualifiers();
                this.loadEmployees();
                this.loadSections();
                this.loadAllocatedHours();
                this.loadPositions();
                this.loadOtherEmployees();
                this.loadLocationsQualifiers();
            }
        },
        employees: function(newval, oldval) {
            if (newval) {
                for(let employee of this.employees) {
                    //console.log(`For employee ${employee.emp_fname} ${employee.emp_lname}, defaultqualifier: ${employee.defaultQualifier}, defaultposition: ${employee.defaultPosition}`);
                    employee.schedules = this.createSchedules(employee.defaultQualifier, employee.defaultPosition);
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
        createSchedule: function(weekDate, defaultqualifier, defaultposition) {
            let schedule = new Schedule(weekDate);
            //schedule.shiftstring = '05:00 AM - 02:00 PM';
            schedule.defaultLocation = this.location.locID;
            schedule.defaultQualifier = defaultqualifier;
            schedule.defaultPosition = defaultposition;
            return schedule;
        },
        createSchedules: function(defaultqualifier, defaultposition) {
            return [ 
                this.createSchedule(this.weekDate(1), defaultqualifier, defaultposition), //new Schedule(this.employee, weekDate(1),'05:00 AM - 02:00 PM'),
                this.createSchedule(this.weekDate(2), defaultqualifier, defaultposition),
                this.createSchedule(this.weekDate(3), defaultqualifier, defaultposition),
                this.createSchedule(this.weekDate(4), defaultqualifier, defaultposition),
                this.createSchedule(this.weekDate(5), defaultqualifier, defaultposition),
                this.createSchedule(this.weekDate(6), defaultqualifier, defaultposition),
                this.createSchedule(this.weekDate(7), defaultqualifier, defaultposition)
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
            newemployee.schedules = this.createSchedules(this.location.defaultQualifier, section.defaultPosition);
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
        loadLocationsQualifiers: function() {
            let url = `getlocationsqualifiers.php?weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                if (json) {
                    this.locationsqualifiers = json;
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
        enterShifts: function(data) {
            this.editdata = data;
            this.$nextTick(function() {
                showShiftEntryModal();
                EventBus.$emit('SHOW-SHIFTENTRYMODAL', data);
            });
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
        highlightCell: function(row, col) {
            this.$el.querySelector(`.shift[data-row="${row}"][data-col="${col}"] input`).classList.add('highlight');
        },
        unhighlightCell: function(row, col) {
            this.$el.querySelector(`.shift[data-row="${row}"][data-col="${col}"] input`).classList.remove('highlight');
        },
        highlightCells: function(startrow, startcol, endrow, endcol){
            for(let i = startrow; i <= endrow; i++){
                for(let j = startcol; j <= endcol; j++) {
                    this.highlightCell(i, j);
                }
            }
        },
        unhighlightAllCells: function() {
            let startrow = 1;
            let endrow = this.employees.length;
            let startcol = 1;
            let endcol = 7;
            for(let i = startrow; i <= endrow; i++){
                for(let j = startcol; j <= endcol; j++) {
                    this.unhighlightCell(i, j);
                }
            }
        },
        weekendingChanged: function() {
            console.log('weekending changed.');
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