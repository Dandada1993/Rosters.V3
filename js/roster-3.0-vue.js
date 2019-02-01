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
        addRosterElements();
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
        addRosterElements();
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
        app.sections = settings.sections;
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
        loadRosterSections();
        loadRosterEmployees();
        loadPositionQualifiers();
    });
});

let numberRows = function(){
    let rowheaders = $('.rowheader:not(.header)');
    for(let i = 0; i < rowheaders.length; i++){
        $(rowheaders[i]).html((i+1));
    }
}

let totalHours = function() {
    let sum = 0;
    let columns = $('.hours:not(.header)');
    for(col of columns) { 
        sum+=parseFloat(col.innerText); 
    }
    return sum;
}

let noMissingCells = function() {
    let missingcells = $('.missing');
    return missingcells.length;
}

let noInvalidCells = function() {
    let invalidrows = $('.invalid');
    return invalidrows.length;
}

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

function Shift(employee, date, shift) {
    if (!new.target) {
        return new Shift(employee, date, shift);
    }

    let _employee = employee;
    let _date = date; //Should be private with a public getting and setter
    let _startTime = null; //Should be private with a public getting and setter
    let _endTime = null; //Should be private with a public getting and setter
    let _location = '';
    let _position = ''; //Should be private with a public getting and setter
    let _qualifier = ''; //Should be private with a public getting and setter
    let _comment = ''; //Should be private with a public getting and setter
    let _isvalid = false;

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
        _isvalid = true;
    }

    Object.defineProperty(this, 'IsValid', {
        get: function() {
            return _isvalid;
        }
    })

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

    this.toString = function(format) {
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

function Schedule(employee, date, shiftstring) {
    if (!new.target) { // if you run me without new
        return new Shift(employee, date, shiftString); // ...I will add new for you
    };

    this.employee = employee;
    let _date = date;
    let _excusecode = '';
    let _shifts = [];
    let _shiftstring = '';
    this.shiftString = '';
    //this.shiftString = shiftstring;

    let parse = function(shiftstring) {
        if (isExcuseCode(shiftstring)){
            _excusecode = getExcuseCode(shiftstring);
        }else{
            _excusecode = '';
            if (isTimes(shiftstring)) {
                let parts = shiftstring.split('/');
                for(part of parts)
                {
                    if (isTimes(part)) {
                        _shifts.push(new Shift(this.employee, _date, part));
                    }
                }
            } else {
                _shifts = [];
            }
        }
    }

    let toString = function(format) { 
        let retval = '';
        if (this.isExcuseCode) {
            retval = _excusecode;
        } else {
            for(shift of _shifts)
            {
                if (retval !== '') {
                    retval += '/';
                }
                retval += shift.toString(format);
            }
        }
        if (retval === '') {
            retval = _shiftstring;
        }
        return retval.toUpperCase();
    }

    let setShiftString = function(value) {
        value = value.trimStart();
        _shiftstring = value;
        _excusecode = '';
        _shifts = [];
        if (value !== ''){
            parse(value);
        }
    }

    this.hours = function() {
        let retval = 0;
        for(shift of _shifts) {
            retval += shift.hours();
        }
        return retval;
    }

    Object.defineProperty(this, 'isValid', {
        get: function() {
            return isValid();
        }
    })

    Object.defineProperty(this, 'isExcuseCode', {
        get: function() {
            return isExcuseCode();
        }
    })

    Object.defineProperty(this, 'isEmpty', {
        get: function() {
            if (toString() === '')
                return true;
            return false;
        }
    })

    Object.defineProperty(this, 'shiftString', {
        get: function() {
            return toString('short');
        },
        set: function(value) {
            // value = value.trimStart();
            // _shiftstring = value;
            // _excusecode = '';
            // _shifts = [];
            // if (value !== ''){
            //     parse(value);
            // }
            setShiftString(value);
        }
    })

    let isExcuseCode = function (value) {
        let regex = new RegExp(patterns.excudecode, 'i');
        return regex.test(value);
    }

    let getExcuseCode = function(value) {
        let regex = new RegExp(patterns.excudecode, 'i');
        return regex.exec(value)[1].trim().toUpperCase();
    }

    let isTimes = function(value) {
        let regex = new RegExp(patterns.times, 'i');
        return regex.test(value);
    }

    let validTimes = function () {
        let valid = false;
        if (_shifts.length > 0) {
            valid = true;
            for (shift of _shifts){
                valid = valid || shift.IsValid;
            }
        }
        return valid;
    }
            
    let isValid = function () {
        return (toString() ==='') || isExcuseCode(_excusecode) || validTimes();
    }

    if (shiftstring !== undefined) {
        this.shiftString = shiftstring;
    }
    //setShiftString(shiftstring);
}

let rostershift = {
    props: ['schedule'],
    template: `<input type="text"
                class="shift-input" 
                :class="{missing :schedule.isEmpty, invalid :!schedule.isValid}"
                v-on:focusin="$emit('focusin')" 
                v-on:focusout="$emit('focusout')" 
                v-model.lazy="schedule.shiftString"
                v-on:change="$emit('change')"/>` //when .lazy omitted entering split shifts fails
}

let rostershiftcell = {
    props: ['schedule'],
    template: `<td 
                class="col shift" 
                :class="{active :isActive}" 
                v-on:focusin="isActive = true" 
                v-on:focusout="isActive = false">
                    <rostershift v-on:change="$emit('update-hours')"
                        :schedule="schedule">
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
    props: ['employee'],
    data: function() {
        return {
            schedules: {
                wed: new Schedule(this.employee, weekDate(1)), //new Schedule(this.employee, weekDate(1), '05:00 AM - 02:00 PM'),
                thu: new Schedule(this.employee, weekDate(2)),
                fri: new Schedule(this.employee, weekDate(3)),
                sat: new Schedule(this.employee, weekDate(4)),
                sun: new Schedule(this.employee, weekDate(5)),
                mon: new Schedule(this.employee, weekDate(6)),
                tue: new Schedule(this.employee, weekDate(7))
            },
            positionqualifiers: [],
            hours: 0
        }
    },
    template: `<tr>
                <td class="col rowheader">&nbsp;</td>
                <td class="col name">{{fullname}}</td>
                <td class="col position">{{position}}</td>
                <rostershiftcell 
                    v-for="(schedule, index) in schedules" 
                    :schedule="schedule" 
                    :key="index"
                    v-on:update-hours="updatehours();">
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
        updatehours: function() {
            this.hours = this.schedules.wed.hours() +
                    this.schedules.thu.hours() +
                    this.schedules.fri.hours() +
                    this.schedules.sat.hours() +
                    this.schedules.sun.hours() +
                    this.schedules.mon.hours() +
                    this.schedules.tue.hours();
        }
    },
    mounted() {
        this.updatehours();
    }
}

let rostersection = {
    props: ['section'],
    template: `<div class="section" v-bind:data-sectionID="section.id">
                <div class="title">{{section.name}}</div>
                <table class="details">
                    <tbody>
                        <rosterslot 
                            class="row" 
                            v-for="(employee, index) in employees" 
                            :employee="employee" 
                            :key="index">
                        </rosterslot>
                    </tbody>
                </table>
               </div>`,
    data: function() {
        return {
            employees: []
        }
    },
    components: {
        'rosterslot' : rosterslot
    },
    created() {
        // this.employees = getEmployeesForSection(this.section.id);
        let sectionEmployees = [];    
        for(employee of settings.employees){
            if (employee.sectionDefID === this.section.id)
            {
                sectionEmployees.push(employee);
            }
        }
        this.employees = sectionEmployees;
    }
}

// let rostertitle = {
//     props: ['location'],
//     data: function() {
//         return {
//             nomissingcells: 0,
//             noinvalidcells: 0
//         }
//     },
//     template: `<div>
//                 <span class="left">
//                   <h2>{{location.name}} (week ending: {{location.weekending.format('dddd MMMM DD, YYYY')}})</h2>
//                 </span>
//                 <span class="right">
//                   <div><h4>Missing cells:</h4><h4 class="stats" v-on:update-hours="updatestats()">{{nomissingcells}}</h4></div>
//                   <div><h4>Invalid cells:</h4><h4 class="stats" v-on:update-hours="updatestats()">{{noinvalidcells}}</h4></div>
//                 </span>
//                </div>`,
//     methods: {
//         updatestats: function() {
//             this.nomissingcells = noMissingCells();
//             this.noinvalidcells = noInvalidCells();
//         }
//     },
//     mounted() {
//         this.updatestats();
//     }
// }

const app = new Vue({
    el: '#main',
    data: {
        sections : [],
        location: {
            name: '',
            weekending: null
            // totalhours: 0,
            // agreedhours: 0,
            // additionalhours: 0
        },
        nomissingcells: 0,
        noinvalidcells: 0
    },
    components: {
        'rostersection' : rostersection
    },
    // created: function() {
    //     let url = `getlocation.php?locID=${settings.locID}&weekstarting=${settings.weekstarting.format('YYYY-MM-DD')}`;
    //     fetch(url)
    //     .then(response => response.json())
    //     .then(json => {
    //         this.location = json;
    //     })
    // },
    methods: {
        updatestats: function() {
            // this.nomissingcells = noMissingCells();
            // this.noinvalidcells = noInvalidCells();
        }
    },
    updated: function(){
        numberRows();
        this.updatestats();
    }
})