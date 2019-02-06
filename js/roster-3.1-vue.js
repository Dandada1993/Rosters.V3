let settings = {
        locID : null,
        locationName : '',
        weekstarting : null,
        weekending : null,
        sections : null,
        employees : null,
        positionqualifiers : null,
        sections_loaded : false,
        employees_loaded : false,
        positionqualifiers_loaded : false
    };

function getLocIDandWeekStarting(){
    settings.locID = $('#selectlocations-dropdown').val();
    settings.locationName = $('#selectlocations-dropdown option:selected').text();
    //console.log(locID);
    settings.weekending = $('#weekending-input').val(); //moment($('#weekending-input').val(), "MM/DD/YYYY");
    settings.weekstarting = moment(settings.weekending, "MM/DD/YYYY").subtract(6, 'days');
    //console.log(weekstarting);
};

function callAsyncGET(url, success, failure) {
    $.ajax({url:url}).done(success).fail(failure);
}

function loadRosterSections(){
    let url = `getsections.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
    let success = function(results) {
        settings.sections = results;
        //console.log(sections);
        settings.sections_loaded = true;
        addRosterElements();
    };
    let failure = function() {
        console.log('Loading roster sections failed');
    };
    callAsyncGET(url, success, failure);
}

function loadRosterEmployees(){
    let url = `getemployees.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
    let success = function(results) {
        settings.employees = results;
        // console.log(employees);
        settings.employees_loaded = true;
        //addRosterElements();
    };
    let failure = function() {
        console.log('Loading roster sections failed');
    };
    callAsyncGET(url, success, failure);
}

function loadPositionQualifiers(){
    let url = `getpositionqualifiers.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
    let success = function(results) {
        settings.positionqualifiers = results;
        // console.log(employees);
        settings.positionqualifiers_loaded = true;
        //addRosterElements();
    };
    let failure = function() {
        console.log('Loading roster sections failed');
    };
    callAsyncGET(url, success, failure);
}

function addRosterElements(){
    if (settings.sections_loaded && settings.employees_loaded && settings.positionqualifiers_loaded)
    {
        //app.employees = employees;
        app.location.name = settings.locationName;
        app.location.weekending = moment(settings.weekending, 'MM/DD/YYYY');
        //app.sections = settings.sections;
    }
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
        // $('#top h2').html(`${settings.locationName} (weekending: ${settings.weekending.format('dddd MMMM DD, YYYY')})`);
        //loadRosterSections();
        //loadRosterEmployees();
        loadPositionQualifiers();
        app.location = {
            name: settings.locationName,
            weekending: moment(settings.weekending, 'MM/DD/YYYY')
        }
    });
});

let numberRows = function(){
    let rowheaders = $('.rownumber');
    for(let i = 0; i < rowheaders.length; i++){
        $(rowheaders[i]).html((i+1));
    }
}

// let totalHours = function() {
//     let sum = 0;
//     let columns = $('.hours:not(.header)');
//     for(col of columns) { 
//         sum+=parseFloat(col.innerText); 
//     }
//     return sum;
// }

// let noMissingCells = function() {
//     let missingcells = $('.missing');
//     return missingcells.length;
// }

// let noInvalidCells = function() {
//     let invalidrows = $('.invalid');
//     return invalidrows.length;
// }

let weekDate = function(day) {  //wed: 1, tue: 7
    let noofdays = day - 7;
    return moment(settings.weekending, 'MM/DD/YYYY').add(noofdays, 'days');
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
        //Location = getLocation(shift);
        //Position = getPosition(shift);
        //Qualifier = getQualifier(shift);
        //Comment = getComment(shift);
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

let rosterslot = {
    props: ['employee', 'employeeindex'],
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
                <td class="col name" :class="{invalid :nameNotSet}">{{fullname}}</td>
                <td class="col position">{{position}}</td>
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
       'rostershiftcell' : rostershiftcell
    },
    computed: {
        fullname: function() {
            return `${this.employee.emp_fname} ${this.employee.emp_lname}`;
        },
        position: function() {
            let position = this.employee.defaultPosition;
            if (this.employee.defaultQualifier !== null && this.positionHasQualifier(position)){
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
        positionHasQualifier: function(position) {
            for(entry in settings.positionqualifiers){
                if (settings.positionqualifiers[entry].Code === position) {
                    return true;
                }
            }
            return false;
        },
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
            this.$emit('delete-row', this.employeeindex);
        }
    },
    mounted() {
        this.updatehours();
    }
}

let rostersection = {
    props: ['section', 'employees'],
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
                            v-on:hours-updated="hoursUpdated()"
                            v-on:delete-row="deleteRow">
                        </rosterslot>
                    </tbody>
                </table>
               </div>`,
    data: function() {
        return {
            deletedemployees: []
        }
    },
    components: {
        'rosterslot' : rosterslot
    },
    methods: {
        emitAddEmployee: function() {
            this.$emit('add-employee', this.section);
        },
        deleteRow: function(index) {
            //console.log(`Received request to delete index ${index}`);
            for(let key in this.deletedemployees) {

            }
            this.deletedemployees.push(this.employees[index]);
            this.employees.splice(index, 1);
            this.$emit('row-deleted');
        },
        hoursUpdated: function() {
            this.$emit('hours-updated');
        }
    }
}

const app = new Vue({
    el: '#main',
    data: {
        sections : null,
        employees: null,
        location: null,
        nomissingcells: 0,
        noinvalidcells: 0,
        totalhours: 0,
        agreedhours: 0
        // additionalhours: 0
    },
    components: {
        'rostersection' : rostersection
    },
    watch: {
        location: function(newval, oldval){
            if (newval) {
                this.loadSections();
                this.loadEmployees();
                this.loadPositionQualifiers();
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
        // showRowNumbers: function() {
        //     numberRows();
        // },
        rowDeleted: function() {
            //console.log('calling row deleted.')
            this.showRowNumbers();
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
        createSchedule: function(weekDate) {
            let schedule = new Schedule(weekDate);
            //schedule.shiftstring = '05:00 AM - 02:00 PM';
            return schedule;
        },
        createSchedules: function() {
            return [ 
                this.createSchedule(weekDate(1)), //new Schedule(this.employee, weekDate(1),'05:00 AM - 02:00 PM'),
                this.createSchedule(weekDate(2)),
                this.createSchedule(weekDate(3)),
                this.createSchedule(weekDate(4)),
                this.createSchedule(weekDate(5)),
                this.createSchedule(weekDate(6)),
                this.createSchedule(weekDate(7))
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
                defaultQualifier: 'REST', // change this to the default qualifier for the location
                sectionDefID: section.id,
                defaultLocation: ''
            }
            newemployee.schedules = this.createSchedules();
            let addindex = this.getAddIndex(section.id);
            //this.employees.push(newemployee);
            this.employees.splice(addindex, 0, newemployee);
        },
        loadSections: function() {
            let url = `getsections.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.sections = json;
            })
        },
        loadEmployees: function() {
            let url = `getemployees.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                this.employees = json;
            })
        },
        loadPositionQualifiers: function() {
            let url = `getpositionqualifiers.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(json => {
                settings.positionqualifiers = json;
            })
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
    // created: function() {
    //     let url = `getlocation.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
    //     fetch(url)
    //     .then(response => response.json())
    //     .then(json => {
    //         this.location = json;
    //     })
    // },
    // updated: function(){
    //     this.$nextTick(function() {
    //         this.showRowNumbers();
    //     })
    // }
})