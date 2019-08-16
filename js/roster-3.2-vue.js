let autoSave = null;

const data = Vue.observable({
    employees: [],
    location: null,
    roster: null,
    locations: [],
    clipboard : '',
    shortcuts: [],
    openinghours: [],
    getOpeningHours: function(locID, date) {
        let weekday = parseInt(date.format('e')) + 1;
        if (this.openinghours) {
            for(let row of this.openinghours) {
                if (row.locID === locID && row.weekday == weekday) {
                    let is_open = false;
                    let opening = null;
                    let closing = null;
                    if (row.is_open === '1') {
                        is_open = true;
                        opening = new moment(row.opening, 'YYYY-MM-DD HH:mm' );
                        closing = new moment(row.closing, 'YYYY-MM-DD HH:mm');
                        // if (row.nextday_closingtime) {
                        //     closing.add(1, 'days');
                        // }
                    }
                    return { is_open: is_open, opening: opening, closing: closing };
                }
            }
        }
        return null;
    },
    getBreakLength: function(locID) {
        for(let row of this.locations) {
            if (row.locID === locID) {
                return parseInt(row.breaklength);
            }
        }
        return 0;
    },
    getMinimumShift: function(locID) {
        for(let row of this.locations) {
            if (row.locID === locID) {
                return parseInt(row.minimumshift);
            }
        }
        return 0;
    },
    getMaximumShift: function(locID) {
        for(let row of this.locations) {
            if (row.locID === locID) {
                return parseInt(row.maximumshift);
            }
        }
        return 0;
    },
    getStartShiftBuffer: function(locID) {
        for(let row of this.locations) {
            if (row.locID === locID) {
                return parseInt(row.start_shiftbuffer);
            }
        }
        return 0;
    },
    getEndShiftBuffer: function(locID) {
        for(let row of this.locations) {
            if (row.locID === locID) {
                return parseInt(row.end_shiftbuffer);
            }
        }
        return 0;
    },
    isOpen: function(locID, date) {
        let weekday = parseInt(date.format('e')) + 1;
        if (this.openinghours) {
            for(let row of this.openinghours) {
                if (row.locID === locID && row.weekday == weekday) {
                    if (row.is_open === '1') {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
        return null;
    }
});

const EventBus = new Vue();

(function ($, window) {

    $.fn.contextMenu = function (settings) {

        return this.each(function () {

            // Open context menu
            $(this).on("contextmenu", function (e) {
                // return native menu if pressing control
                //if (e.ctrlKey) return;
                
                //open menu
                var $menu = $(settings.menuSelector)
                    .data("invokedOn", $(e.target))
                    .show()
                    .css({
                        position: "absolute",
                        left: getMenuPosition(e.clientX, 'width', 'scrollLeft'),
                        top: getMenuPosition(e.clientY, 'height', 'scrollTop')
                    })
                    .off('click')
                    .on('click', 'a', function (e) {
                        $menu.hide();
                
                        var $invokedOn = $menu.data("invokedOn");
                        var $selectedMenu = $(e.target);
                        
                        settings.menuSelected.call(this, $invokedOn, $selectedMenu);
                    });
                
                return false;
            });

            //make sure menu closes on any click
            $('body').click(function () {
                $(settings.menuSelector).hide();
            });
        });
        
        function getMenuPosition(mouse, direction, scrollDir) {
            var win = $(window)[direction](),
                scroll = $(window)[scrollDir](),
                menu = $(settings.menuSelector)[direction](),
                position = mouse + scroll;
                        
            // opening menu would pass the side of the page
            if (mouse + menu > win && menu < mouse) 
                position -= menu;
            
            return position;
        }    

    };
})(jQuery, window);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

function showStartupModal() {
    $('#selectLocations-dialog').modal({
        backdrop: 'static',
        keyboard: false
    });
}

function hideModal() {
    $('#selectLocations-dialog').modal('hide');
}

function showSelectEmployeeModal() {
    $('#selectemployee-dialog').modal('show');
}

function hideSelectEmployeeModal() {
    $('#selectemployee-dialog').modal('hide');
}

function showShiftEntryModal() {
    $('#shiftentry-dialog').modal('show');
}

function hideShiftEntryModal() {
    $('#shiftentry-dialog').modal('hide');
}

let patterns = { 
    excusecode: '^(off(?:\\(r\\))?|~)$', //'^(off(?:\\s?\\(r\\))?|vac|sl|il|cl)$',
    times: '(^(?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)\\s*-\\s*((?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)',
    location: '(?:(?:\\s+)(?:@?)(~))', //'(?:(?:\\s+)@([a-z]{3,4}))'
    position: '(?:(?:\\s*)((?:#?)(rest|barn|dtru)?)?\\s?(~))',
    time: '^(0?\\d|1(?:0|1|2))((?:(\\:)?)((?:0|3)0))?\\s*((?:a|p)m?)',
    qualifier: '(rest|barn|dtru)',
    comment: '(?:\\*\\*)([A-Za-z\\s]+)',
    sansmeridiem: '((?:1(?:0|1|2)|0?\\d)(?:(\\:)?(?:0|3)0)?\\s*(a|p|am|pm)?)\\s*-\\s*((?:1(?:0|1|2)|0?\\d)(?:(\\:)?(?:0|3)0)?\\s*(a|p|am|pm)?)'
};

let Validator = {
    isExcuse: function(value) {
        var regex = new RegExp(patterns.excusecode, 'i');
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
    hasMeridiem: function(value) {
      let regex = new RegExp(patterns.time, 'i'),
          result = regex.exec(value);
      if (result[5]) {
        return true;
      } else {
        return false;
      }
    },
    properTime: function (value) {
        //input must be minimally \da or \dp
        let regex = new RegExp(patterns.time, 'i'),
            result = regex.exec(value),
            hours = result[1].startsWith('0') ? result[1].replace('0', '') : result[1],
            minutes = typeof(result[4]) === "undefined" ? "00" : result[4],
            meridiem = result[5].length === 1 ? result[5] + "m" : result[5];
        return (hours + ':' + minutes + meridiem);
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

    this.date = date; 
    this.shift = shift;
    this.starttime = null; 
    this.endtime = null; 
    this.location = '';
    this.position = ''; 
    this.qualifier = ''; 
    this.comment = ''; 
    this.isOnLoan = false;

    this.parse = function() {
        if (Validator.validShift(this.shift)) {
            let times = Validator.getTime(this.shift);
            this.starttime = new moment(`${this.date.format('YYYY-MM-DD')} ${times.start}`, 'YYYY-MM-DD hh:mm a');
            this.endtime = new moment(`${this.date.format('YYYY-MM-DD')} ${times.end}`, 'YYYY-MM-DD hh:mm a');
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

    this.hours = function(deductbreak = true){
        if (this.starttime && this.endtime) {
            let minutes = this.endtime.diff(this.starttime, 'minutes');
            if (minutes > parseInt(data.location.minimumforbreak)) {
                if (deductbreak) {
                    minutes -= data.getBreakLength(this.location); //parseInt(data.location.breaklength);
                }
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
            if (parts.length === 2 && parts[1].trim()) {
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
            } else {
                if (!this.firstShift.location) {
                    this.firstShift.location = this.defaultLocation;
                }
                if (!this.firstShift.qualifier) {
                    this.firstShift.qualifier = this.defaultQualifier;
                }
                if (!this.firstShift.position) {
                    this.firstShift.position = this.defaultPosition;
                }
            }
            if (this.secondShift && (this.secondShift.location !== data.location.locID)) {
                this.secondShift.isOnLoan = true;
            }
            if (this.firstShift && (this.firstShift.location !== data.location.locID)) {
                this.firstShift.isOnLoan = true;
            }
        } else {
            this.firstShift = null;
            this.secondShift = null;
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

    this.formatFirstShift = function(format, comparisonqualifier = null) {
        if (!comparisonqualifier) {
            comparisonqualifier = this.defaultQualifier;
        }
        let firstShift_options = {};
        if (this.secondShift) {
            if (this.secondShift.location === this.firstShift.location) {
                firstShift_options.showlocation = false;
            } else {
                if (this.firstShift.location !== this.defaultLocation) {
                    firstShift_options.showlocation = true;
                }
            }
            if (this.secondShift.qualifier === this.firstShift.qualifier) {
                firstShift_options.showqualifier = false;
            } else {
                if (this.firstShift.qualifier !== comparisonqualifier) { //if (this.firstShift.qualifier !== this.defaultQualifier) {
                    firstShift_options.showqualifier = true;
                }
            }
            if (this.secondShift.position === this.firstShift.position) {
                firstShift_options.showposition = false;
            } else {
                if (this.firstShift.position !== this.defaultPosition) {
                    firstShift_options.showposition = true;
                }
            }
        } else {
            if (this.firstShift.location !== this.defaultLocation) {
                firstShift_options.showlocation = true;
            }
            if (this.firstShift.qualifier !== comparisonqualifier) { //if (this.firstShift.qualifier !== this.defaultQualifier) {
                firstShift_options.showqualifier = true;
            }
            if (this.firstShift.position !== this.defaultPosition) {
                firstShift_options.showposition = true;
            }
        }
        return this.firstShift.format(format, firstShift_options);
    }

    this.formatSecondShift = function(format, comparisonqualifier = null) {
        if (!comparisonqualifier) {
            comparisonqualifier = this.defaultQualifier;
        }
        let secondShift_options = {};
        if (this.secondShift.location === this.firstShift.location) {
            if (this.secondShift.location === this.defaultLocation) {
                secondShift_options.showlocation = false;
            }
            else {
                secondShift_options.showlocation = true;
            }
        } else {
            if (this.secondShift.location !== this.defaultLocation) {
                secondShift_options.showlocation = true;
            }
        }
        if (this.secondShift.qualifier === this.firstShift.qualifier) {
            if (this.secondShift.qualifier === comparisonqualifier) { //if (this.secondShift.qualifier === this.defaultQualifier) {
                secondShift_options.showqualifier = false;
            }
            else {
                secondShift_options.showqualifier = true;
            }
        } else {
            if (this.secondShift.qualifier !== comparisonqualifier) { //if (this.secondShift.qualifier !== this.defaultQualifier) {
                secondShift_options.showqualifier = true;
            }
        }
        if (this.secondShift.position === this.firstShift.position) {
            if (this.secondShift.position === this.defaultPosition) {
                secondShift_options.showposition = false;
            }
            else {
                secondShift_options.showposition = true;
            }
        } else {
            if (this.secondShift.position !== this.defaultPosition) {
                secondShift_options.showposition = true;
            }
        }
        return this.secondShift.format(format, secondShift_options);
    }

    this.format = function(format, setshiftstring = true) { 
        let retval = '';
        if (Validator.isExcuse(this.shiftstring)) {
            retval = this.shiftstring;
        } else if (Validator.isTimes(this.shiftstring) || this.firstShift){
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
        if (setshiftstring) {
            this.shiftstring = retval.toUpperCase();
        }
        return retval.toUpperCase();
    }

    this.getFullShiftString = function() {
        let options = {
            showlocation: true,
            showqualifier: true,
            showposition: true
        }
        this.setShifts();
        if (this.isExcuse()) {
            return this.shiftstring;
        } else {
            if (this.secondShift) {
                return `${this.firstShift.format('short', options)}/${this.secondShift.format('short', options)}`;
            } else {
                return this.firstShift.format('short', options);
            }
        }
    }

    this.hours = function() {
        var retval = 0;
        if (Validator.isTimes(this.shiftstring)){
            // this.setShifts();
            if (this.firstShift) {
                if (this.secondShift) {
                    retval = this.firstShift.hours(false) + this.secondShift.hours(false);
                } else {
                    retval = this.firstShift.hours();
                }
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

    this.changeLocation = function(newvalue) {
        if (!this.isEmpty() && !this.isExcuse()) {
            if (this.firstShift) {
                this.firstShift.location = newvalue;
            }
            if (this.secondShift) {
                this.secondShift.location = newvalue;
            }
            this.format('short');
        }
    }

    this.changePosition = function(newvalue) {
        if (!this.isEmpty() && !this.isExcuse()) {
            let parts = Validator.getPosition(newvalue);
            if (this.firstShift) {
                this.firstShift.position = parts.position;
                this.firstShift.qualifier = parts.qualifier;
            }
            if (this.secondShift) {
                this.secondShift.position = parts.position;
                this.secondShift.qualifier = parts.qualifier;
            }
            this.format('short');
        }
    }
}

let rostershift = {
    props: ['schedule','employee'],
    template: `<div>
                    <template v-if="allowEdit">
                        <input type="text"
                        spellcheck="false"
                        class="shift-input" 
                        :class="{missing :isEmpty, invalid :!isValid, tooshort :isTooShort, highlight :highlighted, onloan :isOnLoan, visiting :isVisiting, toolong :isTooLong, ousidenormalhours: isOutsideOpeningHours}" 
                        v-model="schedule.shiftstring"
                        v-on:focusin="handleFocusIn" 
                        v-on:focusout="handleFocusOut"   
                        v-on:change="valueChanged()"
                        v-on:keyup.enter="valueChanged()"
                        v-on:dblclick="emitEnterShift(schedule)"
                        v-on:mousedown="handleMouseDown"
                        v-on:mouseup="handleMouseUp"
                        v-on:keyup.arrow-right="handleArrowRight"
                        v-on:keyup.arrow-left="handleArrowLeft"
                        v-on:keyup.arrow-down="handleArrowDown"
                        v-on:keyup.arrow-up="handleArrowUp"
                        data-toggle="tooltip"
                        :title="title"/>
                    </template>
                    <template v-else>
                        <span class="readonly" :class="{isclosed :!isOpen}" v-html="readonlyFormat"></span>
                    </template>
                </div>
                `, 
    data: function() {
        return {
            highlighted: false
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
        },
        row: function() {
            return parseInt(this.$parent.$el.getAttribute('data-row'));
        },
        col: function() {
            return parseInt(this.$parent.$el.getAttribute('data-col'));
        },
        isTooLong: function() {
            //The following check is incorrect. The maximumshift should not be checked against the data.location but the schedule.firstShift.location
            if (Validator.isTimes(this.schedule.shiftstring) && this.schedule.hours() > data.getMaximumShift(this.schedule.firstShift.location)) {
                return true;
            }
            return false;
        },
        isTooShort: function() {
            //The following check is incorrect. The maximumshift should not be checked against the data.location but the schedule.firstShift.location
            if (Validator.isTimes(this.schedule.shiftstring) && this.schedule.hours() < data.getMinimumShift(this.schedule.firstShift.location)) {
                return true;
            }
            return false;
        },
        isOnLoan: function() {
            if (data.location.showloanedemployees === '1') {
                if (Validator.isTimes(this.schedule.shiftstring)
                    && this.employee.defaultLocation.toUpperCase() === data.location.locID.toUpperCase() 
                    && (this.schedule.firstShift && this.schedule.firstShift.location.toUpperCase() !== data.location.locID.toUpperCase() 
                    || (this.schedule.secondShift && this.schedule.secondShift.location.toUpperCase() !== data.location.locID.toUpperCase()))) {
                    return true;
                }
            }
            return false;
        },
        isVisiting: function() {
            if (data.location.showvisitingemployees === '1') {
                if (Validator.isTimes(this.schedule.shiftstring)
                    && this.employee.defaultLocation.toUpperCase() !== data.location.locID.toUpperCase() 
                    && (this.schedule.firstShift && this.schedule.firstShift.location.toUpperCase() === data.location.locID.toUpperCase() 
                    || (this.schedule.secondShift && this.schedule.secondShift.location.toUpperCase() === data.location.locID.toUpperCase()))) {
                    return true;
                }
            }
            return false;
        },
        isOutsideOpeningHours: function() {
            if (data.location.showloanedemployees === '0') {
                return false;
            } else {
                return this.isShiftOutsideOpeningHours(this.schedule.firstShift) || this.isShiftOutsideOpeningHours(this.schedule.secondShift);
            }
        },
        title: function() {
            let result = '';
            if (this.isEmpty) {
                result = 'Enter shift or excuse code';
            } else if (!Validator.isExcuse(this.schedule.shiftstring) && !Validator.validShifts(this.schedule.shiftstring)) {
                result = 'Invalid shift';
            } else if (this.isTooShort) {
                if (this.schedule.firstShift) {
                    result = `Shift is shorter than ${data.getMinimumShift(this.schedule.firstShift.location)} hours`;
                }
            } else if (this.isTooLong) {
                if (this.schedule.firstShift) {
                    result = `Shift is greater than ${data.getMaximumShift(this.schedule.firstShift.location)} hours`;
                }
            } else if (this.isOnLoan) {
                result = `Employee on loan`;
            } else if (this.isVisiting) {
                result = `Employee visiting from ${this.employee.defaultLocation.toUpperCase()}`;
            } else if (Validator.validShifts(this.schedule.shiftstring)) {
                result = this.schedule.format('long', false);
            }
            if (this.isOutsideOpeningHours) {
                if (result) {
                    result += '\r\n';
                }
                result += `Hours selected are outside the normal operating hours for location(s)`;
            }
            return result;
        },
        isOpen: function() {
            return data.isOpen(data.location.locID, this.schedule.date);
        },
        allowEdit: function() {
            //return this.isOpen && data.roster.exportedToAcumen === '0';
            let exportedtoacumen = false;
            if (data.roster && data.roster.exportedToAcumen === '1') {
                exportedtoacumen = true;
            }
            return this.isOpen && !exportedtoacumen
        },
        readonlyFormat: function() {
            let retval = '';
            if (this.schedule) {
                if (this.schedule.isExcuse()) {
                    retval = this.schedule.shiftstring;
                } else {
                    if (this.schedule.firstShift) {
                        retval = this.schedule.formatFirstShift('short', data.location.defaultQualifier);
                    }
                    if (this.schedule.secondShift) {
                        retval = retval + '/<br>' + this.schedule.formatSecondShift('short', data.location.defaultQualifier);
                    }
                }
            }
            return retval;
        }
    },
    methods: {
        valueChanged: function() {
            for(let shortcut of data.shortcuts) {
                if(this.schedule.shiftstring.toLowerCase() === shortcut.shortcut.toLowerCase()) {
                    this.schedule.shiftstring = shortcut.replacement;
                }
            }
            //add preprocessing step to facilitate users entering times without am or pm e.g. 9-4
            //need to identify times without a, p, am or pm; test all permutations against the opening 
            //hours for the shift location and if more than one is valid prompt the user to select the 
            //correct shift, e.g. 11-3 could be 11a-3p or 11p-3a @ROC FRI or SAT nights
            this.checkMeridiem(this.schedule.shiftstring);
            if (this.isValid){
                this.schedule.setShifts();
                this.schedule.format("short");
                if (this.schedule.hours() > data.location.maximumshift) {
                    EventBus.$emit('HOURS-EXCEEDED', { cell: { row: this.row, column: this.col}, schedule: this.schedule });
                }
            }
            this.schedule.isDirty = true;
            this.emitChanged();
        },
        checkMeridiem: function(value) {
            if (!this.isValid) {
                let regex = new RegExp(patterns.sansmeridiem, 'i');
                let permutations = [value];
                let result;
                do {
                    result = regex.exec(value);
                    if (result) {
                        if (!result[3]) {
                            permutations = this.permutate(permutations, result[1]);
                        }
                        if (!result[6]) {
                            permutations = this.permutate(permutations, result[4]);
                        }
                        value = value.replace(regex, '');
                    }
                } while (result);
                //console.log(permutations);
                let validshifts = [];
                for(let permutation of permutations) {
                    if (Validator.validShifts(permutation)) {
                        validshifts.push(permutation);
                    }
                }
                //console.log(validshifts);
                let goodshifts = [];
                for(let validshift of validshifts) {
                    let schedule = new Schedule(this.schedule.date);
                    schedule.defaultLocation = this.schedule.defaultLocation;
                    schedule.defaultPosition = this.schedule.defaultPosition;
                    schedule.defaultQualifier = this.schedule.defaultQualifier;
                    schedule.shiftstring = validshift;
                    schedule.setShifts();
                    schedule.format('short');
                    if (!this.isShiftOutsideOpeningHours(schedule.firstShift) && !this.isShiftOutsideOpeningHours(schedule.secondShift)) {
                        goodshifts.push(schedule.shiftstring);
                    }
                }
                let goodlengths = [];
                for(let goodshift of goodshifts) {
                    let schedule = new Schedule(this.schedule.date);
                    schedule.defaultLocation = this.schedule.defaultLocation;
                    schedule.defaultPosition = this.schedule.defaultPosition;
                    schedule.defaultQualifier = this.schedule.defaultQualifier;
                    schedule.shiftstring = goodshift;
                    schedule.setShifts();
                    schedule.format('short');
                    if (schedule.hours() <= data.getMaximumShift(schedule.defaultLocation)) {
                        goodlengths.push(schedule.shiftstring);
                    }
                }
                //If no shifts survive the good length check revert to the goodshifts
                if (goodlengths.length === 0) {
                    goodlengths = goodshifts;
                }
                //console.log(goodshifts);
                if (goodlengths.length === 1) {
                    this.schedule.shiftstring = goodlengths[0];
                } else if (goodlengths.length > 1) {
                    //prompt user to select shift
                    EventBus.$emit('CHOOSE-SHIFT', { cell: { row: this.row, column: this.col}, choices: goodlengths});
                }
            }
        },
        permutate: function(current, hour) {
            let newlist = [];
            for(let s of current) {
                let spacer = '';
                if (hour.endsWith(' ')) {
                    spacer = ' ';
                }
                newlist.push(s.replace(hour, `${hour.trim()}a${spacer}`));
                newlist.push(s.replace(hour, `${hour.trim()}p${spacer}`));
            }
            return newlist;
        },
        emitChanged: function() {
            this.$emit('cellchanged');
        },
        emitEnterShift: function(schedule) {
            this.$emit('enter-shifts', schedule);
        },
        handleMouseDown: function(event) {
            if (event.ctrlKey) {
                this.highlighted = true;
            } else if (event.shiftKey) {
                EventBus.$emit('CELL-HIGHLIGHT-START', { row: this.row, column: this.col});
            } else {
                if (event.which !== 3 || (event.which === 3 && !this.highlighted)) {
                    EventBus.$emit('CELL-UNHIGHLIGHTED');
                }
            }
        },
        handleMouseUp: function(event) {
            if (event.shiftKey) {
                EventBus.$emit('CELL-HIGHLIGHT-END', { row: this.row, column: this.col});
            }
        },
        handleArrowRight: function(event) {
            EventBus.$emit('ARROW-RIGHT', {row: this.row, column: this.col});
        },
        handleArrowLeft: function(event) {
            EventBus.$emit('ARROW-LEFT', {row: this.row, column: this.col});
        },
        handleArrowDown: function(event) {
            EventBus.$emit('ARROW-DOWN', {row: this.row, column: this.col});
        },
        handleArrowUp: function(event) {
            EventBus.$emit('ARROW-UP', {row: this.row, column: this.col});
        },
        handleFocusIn: function(event) {
            this.$emit('focusin');
            EventBus.$emit('TOOK-FOCUS', {row: this.row, column: this.col});
        },
        handleFocusOut: function(event) {
            this.$emit('focusout');
        },
        cut: function() {
            let copyText = this.$el.children[0]; 
            copyText.select();
            if (document.execCommand("cut")) {
                this.valueChanged();
            }
            //data.clipboard = this.schedule.shiftstring;
            EventBus.$emit('CUTORCOPY', this.schedule.shiftstring);
        },
        copy: function() {
            //each highlighted cell receives the CONTEXTMENU-SELECTIOn event and execute the command independently.
            //To implement multicell copy each hightlighted cell would have to return it's row, column and shiftstring
            //The main view instance would have to store these value in order of row, column value separated by a TAB
            //in a hidden input field. And then execute a copy of that hidden text field
            let copyText = this.$el.children[0]; 
            copyText.select();
            document.execCommand("copy");
            // data.clipboard = this.schedule.shiftstring;
            EventBus.$emit('CUTORCOPY', this.schedule.shiftstring);
        },
        paste: function() {
            if (navigator.clipboard) {
                navigator.clipboard.readText().then(clipText =>
                {
                    this.schedule.shiftstring = clipText;
                    this.valueChanged();
                });
            } else {
                if (data.clipboard) {
                    this.schedule.shiftstring = data.clipboard;
                    this.valueChanged();
                    }
            }
        },
        contextMenuClicked: function(invokedOn, selectedMenu) {
            let action = selectedMenu.text();
            this.performContextMenuAction(action);
            EventBus.$emit('CONTEXTMENU-SELECTION', action);
        },
        performContextMenuAction: function(action) {
            action = action.toLowerCase();
            if (action === 'cut') {
                this.cut();
            } else if (action === 'copy') {
                this.copy();
            } else if (action === 'paste') {
                this.paste();
            } else {
                this.schedule.shiftstring = action;
                this.schedule.setShifts()
                this.schedule.format('short');
                this.schedule.isDirty = true;
                this.emitChanged();
            } 
        },
        onHighlightCell: function(cell) {
            if (this.row === cell.row && this.col === cell.column) {
                this.highlighted = true;
            }
        },
        onTakeFocus: function(cell) {
            if (cell.row === this.row && cell.column === this.col) {
                this.$el.children[0].focus();
                EventBus.$emit('TOOK-FOCUS', cell);
            }
        },
        onChangeLocation: function(newlocation) {
            if (this.highlighted || this.$parent.isActive) {
                this.schedule.changeLocation(newlocation);
                this.schedule.setShifts();
                this.schedule.format('short');
                this.schedule.isDirty = true;
                this.emitChanged();
            }
        },
        onChangePosition: function(newposition) {
            if (this.highlighted || this.$parent.isActive) {
                this.schedule.changePosition(newposition);
                this.schedule.setShifts();
                this.schedule.format('short');
                this.schedule.isDirty = true;
            }
        },
        onSetExcuseCode: function(code) {
            if (this.highlighted || this.$parent.isActive) {
                this.schedule.shiftstring = code;
                this.schedule.setShifts();
                this.schedule.format('short');
                this.schedule.isDirty = true;
                this.emitChanged();
            }
        },
        isShiftOutsideOpeningHours: function(shift) {
            if (shift) {
                let openinghours = data.getOpeningHours(shift.location, shift.date);
                if (!openinghours.is_open) {
                    return true;
                }
                openinghours.opening.subtract(data.getStartShiftBuffer(shift.location), 'minute');
                openinghours.closing.add(data.getEndShiftBuffer(shift.location), 'minute');
                if (shift.starttime.diff(openinghours.opening) < 0 || shift.endtime.diff(openinghours.closing) > 0) {
                    return true;
                }
            }
            return false;
        },
        onShiftChosen: function(eventdata) {
            if (this.row === eventdata.cell.row && this.col === eventdata.cell.column) {
                this.schedule.shiftstring = eventdata.shift;
                this.schedule.setShifts()
                this.schedule.format('short');
                this.schedule.isDirty = true;
                this.emitChanged();
                //this.$set(this.schedule, 'shiftstring', eventdata.shift);
            }
        }
    },
    mounted: function() {
        EventBus.$on('CELL-UNHIGHLIGHTED', () => {
            this.highlighted = false;
        });
        $(this.$el).contextMenu({
            menuSelector: "#contextMenu",
            menuSelected: this.contextMenuClicked
        });
        EventBus.$on('CONTEXTMENU-SELECTION', (action) => {
            if (this.highlighted) {
                this.performContextMenuAction(action);
            }
        });
        EventBus.$on('HIGHLIGHT-CELL', (cell) => {
            this.onHighlightCell(cell);
        });
        EventBus.$on('TAKE-FOCUS', (cell) => {
            this.onTakeFocus(cell);
        });
        EventBus.$on('CHANGE-LOCATION', (newlocation) => {
            this.onChangeLocation(newlocation);
        });
        EventBus.$on('CHANGE-POSITION', (newposition) => {
            this.onChangePosition(newposition);
        });
        EventBus.$on('SET-EXCUSECODE', (code) => {
            this.onSetExcuseCode(code);
        });
        EventBus.$on('MENUOPTION-SELECTION', (action) => {
            if (this.highlighted || this.$parent.isActive) {
                this.performContextMenuAction(action);
            }
        });
        EventBus.$on('SHIFT-CHOSEN', (eventdata) => {
            this.onShiftChosen(eventdata);
        })
    }
}

let rostershiftcell = {
    props: ['schedule', 'employee'],
    template: `<td 
                ref="child"
                class="col shift" 
                :class="{active :isActive, isclosed :!isOpen, missing :isEmpty, invalid :!isValid, tooshort :isTooShort, onloan :isOnLoan, visiting :isVisiting, toolong :isTooLong, ousidenormalhours: isOutsideOpeningHours}"
                >
                    <rostershift 
                        :schedule="schedule"
                        :employee="employee"
                        v-on:focusin="isActive = true" 
                        v-on:cellchanged="emitUpdateHours"
                        v-on:enter-shifts="emitEnterShift">
                    </rostershift>
                    <span class="shift-read" v-html="readonlyFormat"></span>
                </td>`,
    components: {
        'rostershift' : rostershift
    },
    data: function() {
        return {
            isActive : false
        }
    },
    computed: {
        firstShiftString: function() {
            if (this.schedule.firstShift) {
                this.schedule.firstShift.format('short');
            }
        },
        secondShiftString: function() {
            if (this.schedule.secondShift) {
                return this.schedule.secondShift.format('short');
            }
        },
        row: function() {
            return parseInt(this.$el.getAttribute('data-row'));
        },
        col: function() {
            return parseInt(this.$el.getAttribute('data-col'));
        },
        isOpen: function() {
            return data.isOpen(data.location.locID, this.schedule.date);
        },
        allowEdit: function() {
            //return this.isOpen && data.roster.exportedToAcumen === '0';
            let exportedtoacumen = false;
            if (data.roster && data.roster.exportedToAcumen === '1') {
                exportedtoacumen = true;
            }
            return this.isOpen && !exportedtoacumen
        },
        readonlyFormat: function() {
            let retval = '';
            if (this.schedule) {
                if (this.schedule.isExcuse()) {
                    retval = this.schedule.shiftstring;
                } else {
                    if (this.schedule.firstShift) {
                        retval = this.schedule.formatFirstShift('short', data.location.defaultQualifier);
                    }
                    if (this.schedule.secondShift) {
                        retval = retval + '/<br>' + this.schedule.formatSecondShift('short', data.location.defaultQualifier);
                    }
                }
            }
            return retval;
        },
        isValid: function() {
            return this.isEmpty || Validator.validShifts(this.schedule.shiftstring);
        },
        isEmpty: function() {
            if (this.schedule.shiftstring) {
                return false;
            }
            return true;
        },
        isTooLong: function() {
            //The following check is incorrect. The maximumshift should not be checked against the data.location but the schedule.firstShift.location
            if (Validator.isTimes(this.schedule.shiftstring) && this.schedule.hours() > data.getMaximumShift(this.schedule.firstShift.location)) {
                return true;
            }
            return false;
        },
        isTooShort: function() {
            //The following check is incorrect. The maximumshift should not be checked against the data.location but the schedule.firstShift.location
            if (Validator.isTimes(this.schedule.shiftstring) && this.schedule.hours() < data.getMinimumShift(this.schedule.firstShift.location)) {
                return true;
            }
            return false;
        },
        isOnLoan: function() {
            if (data.location.showloanedemployees === '1') {
                if (Validator.isTimes(this.schedule.shiftstring)
                    && this.employee.defaultLocation.toUpperCase() === data.location.locID.toUpperCase() 
                    && (this.schedule.firstShift && this.schedule.firstShift.location.toUpperCase() !== data.location.locID.toUpperCase() 
                    || (this.schedule.secondShift && this.schedule.secondShift.location.toUpperCase() !== data.location.locID.toUpperCase()))) {
                    return true;
                }
            }
            return false;
        },
        isVisiting: function() {
            if (data.location.showvisitingemployees === '1') {
                if (Validator.isTimes(this.schedule.shiftstring)
                    && this.employee.defaultLocation.toUpperCase() !== data.location.locID.toUpperCase() 
                    && (this.schedule.firstShift && this.schedule.firstShift.location.toUpperCase() === data.location.locID.toUpperCase() 
                    || (this.schedule.secondShift && this.schedule.secondShift.location.toUpperCase() === data.location.locID.toUpperCase()))) {
                    return true;
                }
            }
            return false;
        },
        isOutsideOpeningHours: function() {
            if (data.location.showloanedemployees === '0') {
                return false;
            } else {
                return this.isShiftOutsideOpeningHours(this.schedule.firstShift) || this.isShiftOutsideOpeningHours(this.schedule.secondShift);
            }
        },
    },
    methods: {
        emitEnterShift: function(schedule) {
            this.$emit('enter-shifts', schedule);
        },
        emitUpdateHours: function() {
            this.$emit('update-hours');
        },
        onTookFocus: function(cell) {
            if (cell.row === this.row && cell.column === this.col) {
                this.isActive = true;
            } else {
                this.isActive = false;
            }
        },
        isShiftOutsideOpeningHours: function(shift) {
            if (shift) {
                let openinghours = data.getOpeningHours(shift.location, shift.date);
                if (!openinghours.is_open) {
                    return true;
                }
                openinghours.opening.subtract(data.getStartShiftBuffer(shift.location), 'minute');
                openinghours.closing.add(data.getEndShiftBuffer(shift.location), 'minute');
                if (shift.starttime.diff(openinghours.opening) < 0 || shift.endtime.diff(openinghours.closing) > 0) {
                    return true;
                }
            }
            return false;
        }
    },
    mounted: function() {
        EventBus.$on('TOOK-FOCUS', (cell) => {
            this.onTookFocus(cell);
        })
    }
}

let positionselector = {
    props: ['employee','schedules','positions','hasqualifier'],
    template: `<td class="col position">
                    <template v-if="positions && positions.length > 1">
                    <select v-model="selected" tabindex="-1">
                        <option 
                            v-for="(position, index) in positions" 
                            :key="index"
                            :value="position">{{position}}</option>
                    </select>
                    </template>
                    <template v-else>
                        <span>{{positions[0]}}</span>
                    </template>
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
                this.employee.defaultQualifier = null;
            }
            for(let schedule of this.schedules) {
                schedule.defaultQualifier = this.employee.defaultQualifier;
                schedule.defaultPosition = this.employee.defaultPosition;
                if (schedule.shiftstring) {
                    schedule.format('short'); 
                }
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
            // schedules : this.employee.schedules,
            positionqualifiers: [],
            hours: 0
        }
    },
    template: `<tr>
                <td class="col rowheader">
                    <span class="rownumber">{{employeeindex + 1}}</span>
                    <button 
                        v-if="allowEdit"
                        type="button" 
                        class="btn btn-xs" 
                        v-on:click="emitDeleteEmployee()"
                        tabindex="-1"><span class="deleterow">x</span>
                    </button>
                </td>
                <td 
                    class="col name" 
                    :class="{invalid :nameNotSet, gradeA :isGradeA, visiting :isVisiting}"
                    v-on:dblclick="selectEmployee()"
                >{{fullname}}</td>
                <positionselector 
                    :employee="employee" 
                    :schedules="employee.schedules"   
                    :positions="positions"
                    :hasqualifier="hasqualifier">
                </positionselector>
                <rostershiftcell 
                    v-for="(schedule, index) in employee.schedules" 
                    :schedule="schedule" 
                    :employee="employee"
                    :key="index"
                    :data-row="employeeindex + 1"
                    :data-col="index + 1"
                    v-on:update-hours="updatehours()"
                    v-on:enter-shifts="emitEnterShift">
                </rostershiftcell>
                <td class="col hours number" :class="{invalid: !hoursMeetMinimum}" tabindex="-1" data-toggle="tooltip" :title="hoursTitle">{{hours}}</td>
               </tr>`,
    components: {
       'rostershiftcell' : rostershiftcell,
       'positionselector' : positionselector
    },
    computed: {
        fullname: function() {
            let name = `${this.employee.emp_fname} ${this.employee.emp_lname}`;
            if (this.isVisiting && name.trim()) {
                name = name + ` (${this.employee.defaultLocation.toUpperCase()})`;
            }
            return name;
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
        },
        isGradeA: function() {
            if (this.employee.classA === '1') {
                return true;
            }
            return false;
        },
        hoursMeetMinimum: function() {
            if (this.hours === 0) {
                return true;
            } else {
                let target = parseInt(data.location.minimumhours);
                if (this.isGradeA) {
                    target = parseInt(data.location.maximumhours);
                }
                if (this.hours < target) {
                    return false;
                }
                return true;
            }
        },
        isVisiting: function() {
            if (data.location.showvisitingemployees === '1') {
                if (this.employee.defaultLocation.toUpperCase() !== data.location.locID.toUpperCase()) {
                    return true;
                }
            }
            return false;
        },
        hoursTitle: function() {
            let target = parseInt(data.location.minimumhours);
            if (this.isGradeA) {
                target = parseInt(data.location.maximumhours);
            }
            if (this.hours < target) {
                return `Less than the employee's miniumum ${target} hours`;
            } else {
                return '';
            }
        },
        allowEdit: function() {
            //return this.isOpen && data.roster.exportedToAcumen === '0';
            let exportedtoacumen = false;
            if (data.roster && data.roster.exportedToAcumen === '1') {
                exportedtoacumen = true;
            }
            return !exportedtoacumen
        }
    },
    methods: {
        noMissingCells: function() {
            let nomissingcells = 0;
            for(let key in this.employee.schedules) {
                if (this.employee.schedules[key].isEmpty()) {
                    nomissingcells += 1;
                }
            }
            return nomissingcells;
        },
        noInvalidCells: function() {
            let noinvalidcells = 0;
            for(let key in this.employee.schedules) {
                if (!this.employee.schedules[key].isValid()) {
                    noinvalidcells += 1;
                }
            }
            if (this.fullname.trim() === '') {
                noinvalidcells += 1;
            }
            if (!this.hoursMeetMinimum) {
                noinvalidcells += 1;
            }
            return noinvalidcells;
        },
        updatehours: function() {
            this.hours = 0;
            for(let key in this.employee.schedules) {
                this.hours += this.employee.schedules[key].hours();
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
        },
        selectEmployee: function() {
            if (this.allowEdit) {
                this.$emit('select-employee', this.employeeindex)
            }
        },
        contextMenuClicked: function(invokedOn, selectedMenu) {
            let sectionname = selectedMenu.text();
            // console.log(sectionname);
            EventBus.$emit('MOVE-EMPLOYEE', {employee: this.employee, sectionname: sectionname});
        },
    },
    mounted() {
        this.updatehours();
        EventBus.$on('SCHEDULE-UPDATED', () => {
            this.updatehours();
          });
        $(this.$el.querySelector('.name')).contextMenu({
            menuSelector: "#nameContextMenu",
            menuSelected: this.contextMenuClicked
        });
    }
}

let rostersection = {
    props: ['section', 'employees', 'qualifiers', 'positions'],
    template: `<div v-bind:data-sectionID="section.id">
                <table class="title table-bordered">
                    <tbody>
                        <tr>
                            <td>{{section.name}}
                                <span>
                                    <button 
                                        v-if="allowEdit"
                                        type="button" 
                                        class="btn btn-sm btn-add" 
                                        v-on:click="emitAddEmployee()"
                                        tabindex="-1">Add
                                    </button>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table class="details table-bordered">
                    <tbody>
                        <rosterslot 
                            class="rosterrow" 
                            v-for="(employee, index) in employees"
                            v-if="employee.sectionsDefID === section.id" 
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
        },
        allowEdit: function() {
            //return this.isOpen && data.roster.exportedToAcumen === '0';
            let exportedtoacumen = false;
            if (data.roster && data.roster.exportedToAcumen === '1') {
                exportedtoacumen = true;
            }
            return !exportedtoacumen
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

let timeentry = {
    props: {
        value: String,
        start: moment,
        end: moment
    }, 
    data: function() {
        return { 
                times: [],
                selectedvalue: this.value,
                valueindex: 0
            }
    },
    watch: {
        value: function(newVal) {
            this.selectedvalue = this.value;
        },
        start: function(newVal, oldVal) {
            if (!oldVal || newVal.diff(oldVal) !== 0) {
                this.loadTimes();
            }
            // this.valueindex = this.times.indexOf(this.start);
        },
        end: function(newVal, oldVal) {
            if (!oldVal || newVal.diff(oldVal) !== 0) {
                this.loadTimes();
            }
            // this.valueindex = this.times.indexOf(this.start);
        }
        // locID: function() {
        //     this.restrictHours();
        // }
    },
    template: `<select class="form-control" v-model="selectedvalue" v-on:change="emitTimeChanged">
                    <option value="" disabled >Select time</option>
                    <option v-for="(time, index) in times" :key="index" :value="time">{{getDisplayedTime(time)}}</option>
               </select>`,
    methods: {
        emitTimeChanged: function() {
            this.$emit('time-changed', this.selectedvalue);
        },
        setStart: function(value) {
            this.start = value;
        },
        setValueIndex: function() {
            this.valueindex = this.times.indexOf(this.selectedvalue);
        },
        addTime: function(time) {
            this.times.push(time);
        },
        loadTimes: function() {
            this.times = [];
            if (this.start && this.end) {
                let pDate = moment(this.start);
                while (pDate.diff(this.end) < 0) {
                    this.addTime(pDate.format('h:mm a'));
                    pDate = pDate.add(30, 'm');
                }
            }
            this.setValueIndex();
        },
        getDisplayedTime: function(time) {
            let displayedtime = time;
            switch(time) {
                case "12:00 am":
                    displayedtime = "Midnight";
                    break;
                case "12:00 pm":
                    displayedtime = "Noon";
            }
            return displayedtime;
        },
        validIndex: function(index) {
            if (index >= this.valueindex) {
                return true;
            }
            return false;
        }
    },
    created: function() {
        this.loadTimes();
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
            },
            starttimestart: null,
            starttimeend: null,
            endtimestart: null,
            endtimeend: null
        }
    },
    components: {
        'timeentry' : timeentry
    },
    watch: {
        locID: function(newVal, oldVal) {
            this.currentShift.location = newVal;
            this.calculateAllTimes();
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
        previousShift: function() {
            if (this.page === 1) {
                return null
            } else {
                return this.localSchedule.firstShift;
            }
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
                                <h5 class="haserrors" v-show="errors.has()"><span><strong>The fields marked red are required</strong></span></h5>
                            </div>
                            <div class="modal-body">
                                <div v-if="(page===1 && (currentShift.starttime && currentShift.endtime)) || page===2">
                                    <p><span>Shift string:&nbsp;</span>{{shiftstring}}</p>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-6">
                                        <label for="location">Location</label>
                                        <select id="location" v-model="locID" class="form-control">
                                            <option v-for="loc in locations" v-if="isValidRosteredAtLocation(loc)" :value="loc.locID">{{loc.name}}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-4" :class="{haserrors: errors.starttime}">
                                        <label for="starttime">Start Time<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <timeentry 
                                            ref="starttime" 
                                            id="starttime" 
                                            :value="gettime(currentShift.starttime)" 
                                            :start="starttimestart"
                                            :end="starttimeend"
                                            v-on:time-changed="setStartTime"/>
                                    </div>
                                    <div class="col-xs-4" :class="{haserrors: errors.endtime}">
                                        <label for="endtime">End Time<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <timeentry 
                                            ref="endtime" 
                                            id="endtime" 
                                            :value="gettime(currentShift.endtime)" 
                                            :start="endtimestart" 
                                            :end="endtimeend"
                                            v-on:time-changed="setEndTime"/>
                                    </div>
                                    <div class="col-xs-4">
                                        <label for="hours">Hours</label>
                                        <p v-if="(currentShift.starttime && currentShift.endtime) || page===2">{{localSchedule.hours()}}</p>
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <div class="col-xs-6">
                                        <label for="position" :class="{haserrors: errors.position}">Position<span v-show="errors.location"><strong>&nbsp;&#10033;</strong></span></label>
                                        <template v-if="location.positionfixed==='0'">
                                            <select id="position" v-model="currentPosition" class="form-control">
                                                <option value="" disabled>Select position</option>
                                                <option v-for="row in locationsqualifiers" v-if="row.locID===locID" :value="row.position">{{row.position}}</option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <input class="form-control" type="text" v-model="currentPosition" readonly />
                                        </template> 
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
        openingtimes: function() {
            return data.getOpeningHours(this.locID, this.localSchedule.date);
        },
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
                if (this.localSchedule.shiftstring !== this.schedule.shiftstring) {
                    this.schedule.isDirty = true;
                }
                this.schedule.shiftstring = this.localSchedule.shiftstring;
                this.schedule.setShifts();
                this.schedule.format('short');
                this.emitScheduleUpdated();
                this.reset();
            }
        },
        emitScheduleUpdated: function() {
            EventBus.$emit('SCHEDULE-UPDATED');
        },
        gotoPageTwo: function() {
            //console.log('Go to page 2');
            if (this.validate()) {
                this.page = 2;
                this.resetErrors();
                this.validate();
                this.calculateAllTimes();
            }
        },
        gotoPageOne: function() {
            //console.log('Go to page 1');
            //if (this.validate()) {
                this.page = 1;
                this.resetErrors();
                this.validate();
                this.calculateAllTimes();
            //}
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
            this.calculateEndTime();
        },
        setEndTime: function(time) {
            //console.log(`End time: ${time}`);
            this.currentShift.endtime = new moment(`${this.schedule.date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD h:mm a');
            if (this.currentShift.endtime.diff(this.currentShift.starttime) <= 0) {
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
        },
        isValidRosteredAtLocation: function(target) {
            let regex = new RegExp(this.location.rosteredat, 'gi');
            return regex.test(target.type);
        },
        calculatePageOneStartTimeBegin: function() {
            let adjustedopening = this.openingtimes().opening.subtract(data.getStartShiftBuffer(this.locID), 'minute');
            this.starttimestart = adjustedopening;
        },
        calculatePageOneStartTimeEnd: function() {
            this.starttimeend = this.openingtimes().closing.add(data.getEndShiftBuffer(this.locID), 'minute').subtract(data.getMinimumShift(this.locID), 'hour');
        },
        calculatePageOneEndTimeBegin: function() {
            let adjustedopening = this.openingtimes().opening.subtract(data.getStartShiftBuffer(this.locID), 'minute').add(data.getMinimumShift(this.locID), 'hour');
            this.endtimestart = adjustedopening;
            if (this.localSchedule.firstShift.starttime) {
                this.endtimestart = moment(this.localSchedule.firstShift.starttime).add(data.getMinimumShift(this.locID), 'hour');
            }
        },
        calculatePageOneEndTimeEnd: function() {
            this.endtimeend = this.openingtimes().closing.add(data.getEndShiftBuffer(this.locID), 'minute');
            if (this.localSchedule.firstShift.starttime) {
                return moment(this.localSchedule.firstShift.starttime).add(data.getMaximumShift(this.locID), 'hour');
            }
        },
        calculatePageTwoStartTimeBegin: function() {
            let adjustedopening = moment(this.localSchedule.firstShift.endtime).add(60, 'minute');
            this.starttimestart = adjustedopening;
        },
        calculatePageTwoStartTimeEnd: function() {
            this.starttimeend = this.openingtimes().closing.add(data.getEndShiftBuffer(this.locID), 'minute');
        },
        calculatePageTwoEndTimeBegin: function() {
            let adjustedopening = moment(this.localSchedule.firstShift.endtime).add(60, 'minute');
            this.endtimestart = adjustedopening;
            // if (this.localSchedule.secondShift.starttime) {
            //     this.endtimestart = moment(this.localSchedule.secondShift.starttime).add(data.getMinimumShift(this.locID), 'hour');
            // }
        },
        calculatePagetwoEndTimeEnd: function() {
            this.endtimeend = this.openingtimes().closing.add(data.getEndShiftBuffer(this.locID), 'minute');
            if (this.localSchedule.secondShift.starttime) {
                this.endtimeend = moment(this.localSchedule.secondShift.starttime).add(data.getMaximumShift(this.locID), 'h').substract(this.localSchedule.firstShift.hours(), 'hour');
            }
        },
        calculateStartTime: function() {
            if (this.page === 1) {
                this.calculatePageOneStartTimeBegin();
                this.calculatePageOneStartTimeEnd();
            } else {
                this.calculatePageTwoStartTimeBegin();
                this.calculatePageTwoStartTimeEnd();
            }
        },
        calculateEndTime: function() {
            if (this.page === 1) {
                this.calculatePageOneEndTimeBegin();
                this.calculatePageOneEndTimeEnd();
            } else {
                this.calculatePageTwoEndTimeBegin();
                this.calculatePageTwoEndTimeEnd();
            }
        },
        calculateAllTimes: function() {
            this.calculateStartTime();
            this.calculateEndTime();
        }
    },
    mounted () {
        EventBus.$on('SHOW-SHIFTENTRYMODAL', (data) => {
          this.updateData(data);
          this.calculateAllTimes();
        })
    }
}

// let okbutton = {
//     template: `<button type="button" class="btn btn-primary" v-on:click="handleClick">Proceed</button>`,
//     methods: {
//         handleClick: function() {
//             this.$emit('click');
//         }
//     }
// }

let genericdialog = {
    props: {
        showCancel: Boolean,
        handle: String,
        title: String,
        secondarytitle: String
    },
    // components: {
    //     'okbutton' : okbutton
    // },
    template: `<div v-bind:id="handle" class="modal fade" tabindex=-1 role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button v-if="showCancel" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">{{title}}</h4>
                            <h5 class="modal-title">{{secondarytitle}}</h5>
                        </div>
                        <div class="modal-body">
                            <slot name="body">Default Value</slot>
                        </div>
                        <div class="modal-footer">
                            <button v-if="showCancel" type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                            <slot name="btn_ok"></slot>
                        </div>
                    </div>
                </div>
            </div>`
}

let selectiondialog = {
    props: {
        showCancel: Boolean,
        handle: String,
        title: String,
        secondarytitle: String,
        searchtext: String
    },
    // data: function() {
    //     return {
    //         searchText: ''
    //     }
    // },
    components: {
        'genericdialog' : genericdialog
    },
    template: `<genericdialog
                    class="selectsearch-dialog"
                    :handle="handle"
                    :title="title"
                    :secondarytitle="secondarytitle"
                    :show-cancel="showCancel">
                        <template slot="body">
                            <input type="text" v-model="searchtext" v-on:input="$emit('input',searchtext)">
                            <ul>
                                <slot name="elements"></slot>
                            </ul>
                        </template>
                </genericdialog>`
}

let selectemployee = {
    props: ['deletedemployees', 'otheremployees'],
    data: function() {
        return {
            searchText: '',
            selectedEmployee: null
        }
    },
    components: {
        'selectiondialog' : selectiondialog
    },
    template: `<selectiondialog
                    handle="selectemployee-dialog"
                    title="Select an employee"
                    secondarytitle="Double click to select"
                    :searchtext="searchText"
                    show-cancel
                    v-on:input="searchTextChanged">
                    <template slot="elements">
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
                    </template>
                </selectiondialog>`,
    methods: {
        searchTextChanged: function(searchtext) {
            //console.log(`New search text ${searchtext}`);
            this.searchText = searchtext;
        },
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

let selectshift = {
    props: ['choices'],
    components: {
        'genericdialog' : genericdialog
    },
    template: `<genericdialog
                    class="selectshifts-dialog"
                    title="Ambigious shift string provided. Please select correct shift."
                    secondarytitle="Double click to select"
                    show-cancel>
                        <template slot="body">
                        <li 
                            v-for="shift in choices"
                            v-on:dblclick="shiftselected(shift)">{{shift}}</li>
                        </template>
                </genericdialog>`,
    methods: {
        shiftselected: function(shift) {
            this.$emit('shift-selected', shift);
        }
     }
}

let copyfromroster = {
    props: ['approvedrosters'],
    data: function() {
        return {
            searchText: ''
        }
    },
    components: {
        'selectiondialog' : selectiondialog
    },
    template: `<selectiondialog
                    handle="selectroster-dialog"
                    title="Select a week to copy the roster from"
                    secondarytitle="Double click to selct"
                    :searchtext="searchText"
                    show-cancel
                    v-on:input="searchTextChanged">
                    <template slot="elements">
                        <template v-if="approvedrosters.length > 0">
                            <li
                                v-for="roster in approvedrosters"
                                v-show="matchesSearch(roster)"
                                v-on:dblclick="rosterSelected(roster)">{{displayWeek(roster)}}</li>
                        </template>
                        <template v-else>
                            <p>There are no approved rosters to copy from</p>
                        </template>
                    </template>
                </selectiondialog>`,
    methods: {
        searchTextChanged: function(searchtext) {
            //console.log(`New search text ${searchtext}`);
            this.searchText = searchtext;
        },
        matchesSearch: function(roster) {
            let display = this.displayWeek(roster);
            return display.toLowerCase().includes(this.searchText.toLowerCase());
        },
        displayWeek: function(roster) {
            return moment(roster.weekending, 'YYYY-MM-DD').format('dddd MMM D, YYYY');;
        },
        rosterSelected: function(roster) {
            //console.log('Entry double clicked');
            this.searchText = '';
            this.$emit('copyfromweekending', roster);
        }
    }
}

let maxhoursexceeded = {
    props: ['hours', 'shiftstring', 'cell'],
    components: {
        'genericdialog' : genericdialog
    },
    template: `<genericdialog
                    handle="maximumhoursexceeded"
                    :title="title">
                    <template slot="body">
                        <div class="form-group">
                            <p>{{message}}</p>
                            <p>Are you sure you want to continue?</p>
                        </div>
                    </template>
                    <template slot="btn_ok">
                        <button type="button" class="btn btn-default" v-on:click="closeDialog">Close</button>
                        <button type="button" class="btn btn-primary" v-on:click="maximumhoursviolated_okclicked">Edit</button>
                    </template>
                </genericdialog>`,
    computed: {
        title: function() {
            return `Shift is more than ${this.hours} hours`;
        },
        message: function() {
            return `The shift ${this.shiftstring} is more than ${this.hours} hours in length.`;
        }
    },
    methods: {
        maximumhoursviolated_okclicked: function() {
            this.closeDialog();
            EventBus.$emit('TAKE-FOCUS', this.cell);
        },
        closeDialog: function() {
            $(this.$el).modal('hide');
        }
    }
}

const app = new Vue({
    el: '#main',
    data: {
        options: null,
        roster: null,
        locations: null,
        sections : null,
        employees: null,
        savedschedules: null,
        positionQualifiers: null,
        excusecodes: null,
        location: null,
        locID: '',
        weekending: null,
        weekstarting: null,
        positions: [],
        nomissingcells: 0,
        noinvalidcells: 0,
        totalhours: 0,
        loanedhours: 0,
        agreedhours: 0,
        additionalhours: 0,
        deletedemployees: [],
        deletedEmployeeIDs: [],
        otheremployees: [],
        editEmployeeIndex: -1,
        editdata: null,
        locationsqualifiers: [],
        disabledDates: {
            days: [0,1,3,4,5,6]
        },
        errors: {
            location: false,
            weekending: false,
            has: function() {
                if (this.location || this.weekending) {
                    return true;
                }
                return false;
            }
        },
        contextMenuEnabled: false,
        highlight: {
            start: null,
            end: null
        },
        approvedrosters: [],
        hoursexceeded: 0,
        hoursexceeded_shiftstring: '',
        hoursexceeded_cell: null,
        acumenexport: {
            title : '',
            body : ''
        },
        showdrafttext: true,
        noemployees: 0,
        noshifts: 0,
        noexcusecodes: 0,
        shortcuts: [],
        schedulesloaded: false,
        texttopaste: false,
        shiftchoices: {
            cell: null,
            choices: null
        },
        saveconflicts: ''
    },
    components: {
        'rostersection' : rostersection,
        'selectemployee' : selectemployee,
        'shiftentry' : shiftentry,
        'datepicker' : vuejsDatepicker,
        'genericdialog' : genericdialog,
        'selectiondialog' : selectiondialog,
        'copyfromroster' : copyfromroster,
        'maxhoursexceeded' : maxhoursexceeded,
        'selectshift' : selectshift
    },
    watch: {
        roster: function(newVal) {
            if (newVal) {
                if (newVal.exportedToAcumen === '1') {
                    if (autoSave) {
                        clearInterval(autoSave);
                        //console.log('Cancelling auto save');
                    }
                }
            }
            data.roster = newVal;
        },
        locations: function() {
            this.setLocationsRegExPattern();
            let requestedLocID = this.$el.querySelector('#locID').value;
            let requestedWeekending = this.$el.querySelector('#weekending').value;
            if (requestedLocID) {
                this.locID = requestedLocID;
            }
            if (requestedWeekending) {
                let parts = requestedWeekending.split('-');
                let year = parseInt(parts[0]);
                let month = parseInt(parts[1]) - 1;
                let day = parseInt(parts[2]);
                this.weekending = new Date(year, month, day);
            }
            if (this.locID && this.weekending) {
                this.setWeekstarting();
                this.setLocation();
            } else {
                this.validate();
                showStartupModal();
            }  
        },
        location: function(newval){
            if (newval) {
                data.location = newval;
                let openinghours = this.loadOpeningHours();
                let positionqualifiers = this.loadPositionQualifiers();
                let roster = this.loadRoster();
                let sections = this.loadSections();
                let allocatedhours = this.loadAllocatedHours();
                let positions = this.loadPositions();
                let otheremployees = this.loadOtherEmployees();
                let locationqualifiers = this.loadLocationsQualifiers();
                let excusecodes = this.loadExcuseCodes();
                let shortcuts = this.loadShortcuts();
                let approvedrosters = this.loadApprovedRosters();
                Promise.all([openinghours, positionqualifiers, roster, sections, allocatedhours, positions, otheremployees, locationqualifiers, excusecodes, shortcuts, approvedrosters])
                .then(() => {
                    this.loadEmployees();
                    document.title = `${this.location.name} Roster weekending ${this.weekendingDisplay}`;
                });
                // if (newval.autoApprove === '1') {
                //     this.showdrafttext = false;
                // }
            }
        },
        employees: function(newval, oldval) {
            if (newval) {
                this.createEmployeeSchedules();
            }
        },
        savedschedules: function(newval, oldval) {
            if (newval) {
                this.showSavedEmployeeSchedules();
            }
        },
        excusecodes: function() {
            this.setExcuseCodesRegExPattern();
        },
        options: function(newVal) {
            if (newVal) {
                let frequency = this.getOptionValue('savefrequency');
                if (frequency) {
                    frequency = parseInt(frequency);
                }
                if (frequency !== 0) {
                    autoSave = window.setInterval(() => {
                        this.saveRoster();
                        console.log('Auto saved');
                    }, frequency);
                }
            }
        }
    },
    computed: {
        difference: function() {
            return this.agreedhours + this.additionalhours - this.totalhours;
        },
        weekendingDisplay: function() {
            return moment(this.formatWeekending(), 'MM/DD/YYYY').format('dddd MMM D, YYYY');
        },
        month: function() {
            return moment(this.formatWeekending(), 'MM/DD/YYYY').format('MMMM');
        },
        exportedToAcumen: function() {
            if (this.roster && this.roster.exportedToAcumen === '1') {
                return true;
            }
            return false;
        },
        rosterURL: function() {
            let url = this.getOptionValue('url');
            if (url) {
                let weekending = moment(this.formatWeekending(), 'MM/DD/YYYY').format('YYYY-MM-DD')
                url = `${url}?locid=${this.location.locID}&weekending=${weekending}`;
                return url;
            }
            return null;
        }
    },
    methods: {
        getOptionValue: function(name) {
            if (this.options) {
                for(let option of this.options) {
                    if (option.name.toLowerCase() === name.toLowerCase()) {
                        return option.value;
                    }
                }
            }
            return null;
        },
        clipboardEmpty: function() {
            if (!this.texttopaste) {
                return true;
            }
            return false;
        },
        setLocationsRegExPattern: function() {
            let pattern = '';
            for(let i = 0; i < this.locations.length; i++) {
                if (i > 0) {
                    pattern += '|';
                }
                pattern += this.locations[i].locID;
            }
            patterns.location = patterns.location.replace('~', pattern);
        },
        setExcuseCodesRegExPattern: function() {
            let pattern = '';
                if (this.excusecodes) {
                for(let i = 0; i < this.excusecodes.length; i++) {
                    if (this.excusecodes[i].isoff === '0') {
                        if (pattern) {
                            pattern += '|';
                        }
                        pattern += this.excusecodes[i].code;
                    }
                }
                patterns.excusecode = patterns.excusecode.replace('~', pattern);
            }
        },
        updatestats: function() {
            //console.log("updating stats");
            if (this.employees) {
                this.nomissingcells = 0;
                this.noinvalidcells = 0;
                this.noshifts = 0;
                this.noexcusecodes = 0;
                for(employee of this.employees) {
                    if(employee.noMissingCells) {
                        this.nomissingcells += employee.noMissingCells;
                    }
                    if(employee.noInvalidCells) {
                        this.noinvalidcells += employee.noInvalidCells;
                    }
                    for (schedule of employee.schedules) {
                        if (schedule.shiftstring) {
                            if (Validator.isExcuse(schedule.shiftstring)) {
                                this.noexcusecodes += 1;
                            } else {
                                if (schedule.isSplit()) {
                                    this.noshifts += 2;
                                } else {
                                    this.noshifts += 1;
                                }
                            }
                        }
                    }
                }
                this.noemployees = this.employees.length;
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
            if (this.employees[index].id && this.employees[index].id > 0) { //Add employee ID to deletedIDs if it exists and is > 0
                this.deletedEmployeeIDs.push(this.employees[index].id);
            }
            this.employees.splice(index, 1); //remove employee
            this.updatestats();
        },
        hoursUpdated: function() {
            this.totalhours = 0;
            this.loanedhours = 0;
            if (this.employees) {
                for(let employee of this.employees) {
                    // if(employee.hours) {
                    //     this.totalhours += employee.hours;
                    // }
                    for(let schedule of employee.schedules) {
                        if (schedule.firstShift) {
                            let hours = schedule.firstShift.hours();
                            if (schedule.firstShift.isOnLoan && this.location.showloanedemployees === "1") {
                                this.loanedhours += hours;
                            } else {
                                this.totalhours += hours;
                            }
                        }
                        if (schedule.secondShift) {
                            let hours = schedule.secondShift.hours();
                            if (schedule.secondShift.isOnLoan && this.location.showloanedemployees === "1") {
                                this.loanedhours += hours;
                            } else {
                                this.totalhours += hours;
                            }
                        }
                    }
                }
            }
            this.updatestats();
        },
        weekDate: function(day) {  //wed: 1, tue: 7
            let noofdays = day - 7;
            return moment(this.formatWeekending(), 'MM/DD/YYYY').add(noofdays, 'days');
        },
        displayDayNameLong: function(day) {
            let noofdays = day - 7;
            let m = moment(this.formatWeekending(), 'MM/DD/YYYY').add(noofdays, 'days');
            return m.format('dddd');
        },
        displayDayNameShort: function(day) {
            let noofdays = day - 7;
            let m = moment(this.formatWeekending(), 'MM/DD/YYYY').add(noofdays, 'days');
            return m.format('ddd');
        },
        displayDayDate: function(day) {
            let noofdays = day - 7;
            let m = moment(this.formatWeekending(), 'MM/DD/YYYY').add(noofdays, 'days');
            if (day === 1 || m.date() === 1) {
                return m.format('MMM D');
            } else {
                return m.format('D');
            }
        },
        createEmployeeSchedules: function() {
            for(let employee of this.employees) {
                if (!employee.schedules) {
                    //employee.schedules = this.createSchedules(employee);
                    this.$set(employee, 'schedules', this.createSchedules(employee));
                }
            }
        },
        showSavedEmployeeSchedules: function() {
            for(let savedschedule of this.savedschedules) {
                let employee = this.findEmployeeByEmpNo(savedschedule.emp_no);
                let scheduleindex = this.findScheduleIndexByWeekDate(savedschedule.date);
                if (employee && scheduleindex !== null) {
                    let schedule = employee.schedules[scheduleindex];
                    schedule.id = savedschedule.id;
                    schedule.rosterID = savedschedule.rosterID;
                    schedule.shiftstring = savedschedule.shiftstring;
                    schedule.setShifts();
                    schedule.format('short'); 
                }
            };
            this.schedulesloaded = true;
            this.emitScheduleUpdated();
        },
        findEmployeeByEmpNo: function(emp_no) {
            let result = null;
            for(let employee of this.employees) {
                if (employee.emp_no === emp_no) {
                    return employee;
                }
            }
            return result;
        },
        findEmployeeIndexByEmpNo: function(emp_no) {
            let result = -1;
            for(let i = 0; i < this.employees.length; i++) {
                if (this.employees[i].emp_no === emp_no) {
                    return i;
                }
            }
            return result;
        },
        findScheduleIndexByWeekDate: function(date) {
            for(let i = 0; i < 7; i++) {
                if (this.weekDate(i + 1).format('YYYY-MM-DD') === date) {
                    return i;
                }
            }
            return null;
        },
        createSchedule: function(weekDate, employee) {
            let schedule = new Schedule(weekDate);
            schedule.id = '0';
            schedule.defaultLocation = this.location.locID;
            schedule.defaultQualifier = employee.defaultQualifier;
            schedule.defaultPosition = employee.defaultPosition;
            schedule.isDirty = false;
            schedule.shiftstring = '';
            if (!data.isOpen(this.location.locID, schedule.date)) {
                schedule.shiftstring = 'OFF';
                schedule.isDirty = true;
            }
            return schedule;
        },
        createSchedules: function(employee) {
            return [ 
                this.createSchedule(this.weekDate(1), employee), //new Schedule(this.employee, weekDate(1),'05:00 AM - 02:00 PM'),
                this.createSchedule(this.weekDate(2), employee),
                this.createSchedule(this.weekDate(3), employee),
                this.createSchedule(this.weekDate(4), employee),
                this.createSchedule(this.weekDate(5), employee),
                this.createSchedule(this.weekDate(6), employee),
                this.createSchedule(this.weekDate(7), employee)
            ]
        },
        getAddIndex: function(sectionid) {
            let addindex = this.employees.length;
            let found = false;
            for(let i = 0; i < this.employees.length; i++) {
                if (this.employees[i].sectionsDefID === sectionid) {
                    found = true;
                }
                if (found){
                    if (this.employees[i].sectionsDefID !== sectionid) {
                        addindex = i;
                        break;
                    }
                }
            }
            return addindex;
        },
        addEmployee: function(section, newemployee = null) {
            if (!newemployee) {
                newemployee = {
                    id: 0,
                    emp_no: '',
                    emp_fname: '',
                    emp_lname: '',
                    gender: '',
                    defaultPosition: section.defaultPosition,
                    defaultQualifier: this.location.defaultQualifier,
                    sectionsDefID: section.id,
                    defaultLocation: ''
                };
                newemployee.schedules = this.createSchedules(this.location.defaultQualifier, section.defaultPosition);
            } 
            let addindex = this.getAddIndex(section.id);
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
        loadRoster: function() {
            let url = `getroster.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.length === 1) {
                    this.roster = result[0];
                    //data.roster = this.roster;
                }
                // if (callback) {
                //     callback();
                // }
            })
        },
        loadSections: function() {
            let url = `getsections.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
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
                this.loadRosterSchedules();
            })
        },
        loadPositionQualifiers: function() {
            let url = `getpositionqualifiers.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(json => {
                this.positionQualifiers = json;
            })
        },
        loadAllocatedHours: function() {
            let url = `getallocatedhours.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(json => {
                this.agreedhours = parseFloat(json[0].allocatedhours); //json;
                this.additionalhours = parseFloat(json[0].additionalhours);
            })
        },
        loadPositions: function() {
            let url = `getpositions.php?locID=${this.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(json => {
                this.extractPositions(json);
            })
        },
        loadOtherEmployees: function() {
            let url = `getotheremployees.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(json => {
                if (json) {
                    this.otheremployees = json;
                }
            })
        },
        loadLocationsQualifiers: function() {
            let url = `getlocationsqualifiers.php?weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(json => {
                if (json) {
                    this.locationsqualifiers = json;
                }
            })
        },
        loadRosterSchedules: function() {
            let url = `getrosterschedules.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(results => {
                if (results) {
                    this.savedschedules = results;
                }
            })
        },
        loadRosterSchedulesFromCopy: function(copyfrom) {
            url = `getrosterschedules.php?locID=${this.location.locID}&weekstarting=${copyfrom.format('YYYY-MM-DD')}&copyto=${this.weekstarting.format('YYYY-MM-DD')}`;
            fetch(url)
            .then(response => response.json())
            .then(results => {
                if (results) {
                    this.updateSchedules(results);
                }
            })
        },
        loadExcuseCodes: function() {
            let url = 'getexcusecodes.php';
            return fetch(url)
            .then(response => response.json())
            .then(results => {
                this.excusecodes = results;
            })
        },
        loadShortcuts: function() {
            let url = `getshortcuts.php?locID=${this.location.locID}`;
            return fetch(url)
            .then(response => response.json())
            .then(results => {
                this.shortcuts = results;
                data.shortcuts = results;
            })
        },
        loadApprovedRosters: function() {
            let url = `getapprovedrosters.php?locID=${this.location.locID}`;
            return fetch(url)
            .then(response => response.json())
            .then(results => {
                this.approvedrosters = results;
            });
        },
        loadOpeningHours: function() {
            let url = `getopeninghours.php?weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(results => {
                data.openinghours = results;
            })
        },
        approveRoster: function() {
            let url = `approveroster.php?id=${this.roster.id}`;
            fetch(url);
        },
        saveRoster: function(exportToAcumen = false, confirm = false) {
            let url = `saveroster.php?locID=${this.location.locID}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            if (exportToAcumen) {
                url = url + `&exporttoacumen=1`;
            }
            return fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result) {
                    this.loadRoster()
                    .then(() => {
                        this.completeRosterSave()
                        .then(() => {
                            this.acumenexport.title = 'Save succeeded';
                            this.acumenexport.body = 'The roster was saved successful.'
                            if (this.saveconflicts) {
                                this.acumenexport.body = `${this.acumenexport.body}.<p>However some save conflicts were encountered:</p>${this.saveconflicts}`;
                            }
                            this.saveconflicts = null;
                        })
                        .catch(() => {
                            this.acumenexport.title = 'Save failed';
                            this.acumenexport.body = 'Some errors occurred while saving this roste. Please notify the systems department.'
                        }).finally(() => {
                            if (confirm) {
                                $(this.$refs.resultAcumenExportDialog.$el).modal('show');
                            }
                        });
                    });
                }
            });
        },
        completeRosterSave: function() {
            if (this.roster.id) {
                //this.roster = result[0];
                let saves = this.saveRosterEmployees();
                let deletions = this.removeDeletedRosterEmployees();
                let alltasks = saves.concat(deletions);
                return Promise.all(alltasks)
                .then(() => {
                    return Promise.all(this.saveRosterSchedules());
                });
            }
            return Promise.resolve(null);
        },
        saveRosterEmployees: function() {
            let promises = [];
            for(let employee of this.employees) {
                if (employee.emp_no) { 
                    promises.push(this.saveRosterEmployee(employee)); 
                }
            };
            return promises;
        },
        removeDeletedRosterEmployees: function() {
            let promises = [];
            for(let id of this.deletedEmployeeIDs) {
                promises.push(this.deleteRosterEmployee(id));
            }
            return promises;
        },
        saveRosterEmployee: function(employee) {
            let formData = new FormData();
            formData.append('rostersID', this.roster.id);
            let id = 0;
            if (employee.id) {
                id = employee.id;
            }
            formData.append('id', id);
            formData.append('emp_no', employee.emp_no);
            formData.append('defaultposition', employee.defaultPosition);
            formData.append('defaultqualifier', employee.defaultQualifier);
            formData.append('sectionsdefid', employee.sectionsDefID);
            let url = 'saverosteremployee.php';
            return fetch(url, {
                method: 'POST',
                body: formData 
            })
            .then(response => response.json())
            .then(result => {
                if (result) {
                    if (!employee.id || employee.id === "0") {
                        employee.id = result[0].id;
                    }
                    //this.saveRosterSchedules(employee);
                }
            })

        },
        deleteRosterEmployee: function(id) {
            let url = `deleterosteremployee.php?id=${id}`;
            return fetch(url)
            // .then(response => response.json())
            .catch(error => console.error(`Failed to delete employee with id: ${id} due to the following error:`, error));
        },
        saveRosterSchedules: function() {
            let promises = [];
            for(let employee of this.employees) {
                for(let schedule of employee.schedules) {
                    if (schedule.isDirty) {
                        if (schedule.shiftstring) {
                            promises.push(this.saveRosterSchedule(employee, schedule));
                        } else {
                            if (parseInt(schedule.id) > 0) {
                                promises.push(this.deleteEmployeeSchedule(schedule.id));
                            }
                        }
                    }
                }
            }
            return promises;
        },
        saveRosterSchedule: function(employee, schedule) {
            let url = `saverosterschedule.php?id=${schedule.id}&rosterEmpID=${employee.id}&date=${schedule.date.format('YYYY-MM-DD')}&shiftstring=${encodeURIComponent(schedule.getFullShiftString())}`;
            if (schedule.firstShift) {
                url += `&locid1=${schedule.firstShift.location}`;
            }
            if (schedule.secondShift) {
                url += `&locid2=${schedule.secondShift.location}`;
            }
            return fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result) {
                    if (result.id > 0) {
                        schedule.id = result.id
                        schedule.rosterID = this.roster.id;
                        schedule.isDirty = false;
                    } else if (result.id == -1) {
                        //there is another schedule in the database which conflicted same weekstarting, emp_no and date
                        if (schedule.shiftstring !== result.shiftstring) {
                            schedule.id = result.existingid;
                            schedule.rosterID = result.rosterID;
                            schedule.shiftstring = result.shiftstring;
                            schedule.setShifts();
                            schedule.format('short');
                            schedule.isDirty = false;
                            //prompt user that there was a save conflict for employee for date 
                            let error = `A conflict occurred when attempting to save schedule for ${employee.emp_fname} ${employee.emp_lname} on ${schedule.date.format('dddd MMMM DD')}. The shift has been updated to show the saved shift ${result.shiftstring}`;
                            if (this.saveconflicts) {
                                this.saveconflicts = `${this.saveconflicts}<p>${error}</p>`;
                            } else {
                                this.saveconflicts = `<p>${error}</p>`;
                            }
                        }
                    }
                }
            });
        },
        deleteEmployeeSchedule: function(id) {
            let url = `deleteemployeeschedule.php?id=${id}`;
            return fetch(url)
            .then(response => response.json())
            .catch(error => console.error(`Failed to delete employee with id: ${id} due to the following error:`, error));
        },
        insertPayException: function(employee, schedule) { //This function has been deprecated. The schedules are now inserted at the db level.
            //console.log('Insert Pay Exception');
            let pComment = this.getPComment(schedule.shiftstring);
            let formData = new FormData();
            formData.append('emp_no', employee.emp_no);
            formData.append('pComment', pComment);
            formData.append('date', schedule.date.format('YYYY-MM-DD'));
            formData.append('islive', this.location.isLive);
            let url = 'insertPayException.php';
            return fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                return result[0].id;
            })
            .catch(error => { return 0; });
            // const request = async () => { await fetch(url, { method: 'POST', body: formData}); }
            // request();
        },
        deleteSchedule: function(employee, date) {
            let url = `deleteSchedule.php?&emp_no=${employee.emp_no}&date=${date.format('YYYY-MM-DD')}&islive=${this.location.isLive}`;
            return fetch(url)
            // .then(response => response.json())
            .catch(error => console.error(`Failed to delete Working Schedule`, error));
        },
        deleteSchedules: function() {
            let deletions = [];
            for(let employee of this.employees) {
                for(let schedule of employee.schedules) {
                    deletions.push(this.deleteSchedule(employee, schedule.date));
                }
            }
            return Promise.all(deletions);
        },
        insertWorkingSchedule: function(employee, shift) { //This function has been deprecated. The schedules are now inserted at the db level.
            let formData = new FormData();
            formData.append('emp_no', employee.emp_no);
            formData.append('date', shift.date.format('YYYY-MM-DD hh:mma'));
            formData.append('start', shift.starttime.format('YYYY-MM-DD hh:mma'));
            formData.append('stop', shift.endtime.format('YYYY-MM-DD hh:mma'));
            formData.append('locid', shift.location);
            formData.append('position', shift.position);
            formData.append('qualifier', shift.qualifier);
            formData.append('islive', this.location.isLive);
            let url = 'insertWorkingSchedule.php';
            return fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                 return result[0].id;
            })
            .catch(error => { return 0; });
            // const request = async () => { await fetch(url, { method: 'POST', body: formData}); }
            // request();
        },
        insertSchedules: function() { //This function has been deprecated. The schedules are now inserted at the db level.
            let payexception_promises = [];
            let schedule_promises = [];
            for(let employee of this.employees) {
                for(let schedule of employee.schedules) {
                    if (schedule.isExcuse()) {
                        payexception_promises.push(this.insertPayException(employee, schedule));
                    } else {
                        if (schedule.firstShift) {
                            // console.log('Inserting shift 1');
                            schedule_promises.push(this.insertWorkingSchedule(employee, schedule.firstShift));
                        }
                        if (schedule.secondShift) {
                            // console.log('Inserting shift 2');
                            schedule_promises.push(this.insertWorkingSchedule(employee, schedule.secondShift));
                        }
                    }
                }
            }
            let payexception_failures = 0;
            let schedule_failures = 0;
            Promise.all(payexception_promises)
            .then(values => {
                values.forEach(function(value) {
                    if (parseInt(value) === 0) {
                        payexception_failures++;
                    }
                })
            });
            Promise.all(schedule_promises)
            .then(values => {
                values.forEach(function(value) {
                    if (parseInt(value) === 0) {
                        schedule_failures++;
                    }
                })
            });
            if (payexception_failures > 0 || schedule_failures > 0) {
                // console.log('Some shifts failed to export to Acumen');
                this.acumenexport.title = 'Export failed';
                this.acumenexport.body = 'Some errors occurred while exporting this roster to Acumen. Please notify the systems department.'
            } else {
                this.acumenexport.title = 'Export succeeded';
                this.acumenexport.body = 'The export was successful.'
            }
            $(this.$refs.resultAcumenExportDialog.$el).modal('show');
        },
        exportToAcumen: function() {
            this.saveRoster(true); //save roster
            // this.deleteSchedules()
            // .then(this.insertSchedules())
            // .then(this.loadRoster()); 
            let formData = new FormData();
            formData.append('rosterid', this.roster.id);
            let url = 'exporttoacumen.php';
            return fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(this.loadRoster())
            .then($(this.$refs.resultAcumenExportDialog.$el).modal('show'));
        },
        finalPrint: function() {
            this.showdrafttext = false;
            window.onafterprint = () => {
                this.showdrafttext = true;
            }
            this.$nextTick(function() {
                window.print();
            })
        },
        menuoption_exportToAcumen: function() {
            if (this.nomissingcells > 0) {
                $(this.$refs.missingCellsDialog.$el.querySelector('#missingCellsDialogOKButton')).on('click', this.missingCellsModalOKClicked)
                $(this.$refs.missingCellsDialog.$el).modal('show');
            } else {
                this.exportToAcumen();
            }
        },
        confirmApprovalOKClicked: function() {
            $(this.$refs.confirmApproval.$el.querySelector('#confirmApproval_OkButton')).off('click');
            $(this.$refs.confirmApproval.$el).modal('hide');
            this.approveRoster();
            this.menuoption_exportToAcumen();
        },
        menuoption_approve: function() {
            //Confirm that they wish to approve the roster
            //store approval in database
            //Export to acumen
            $(this.$refs.confirmApproval.$el.querySelector('#confirmApproval_OkButton')).on('click', this.confirmApprovalOKClicked);
            $(this.$refs.confirmApproval.$el).modal('show');
        },
        menuoption_finalPrint: function() {
            //need to show dialog informing user that this will cause the shifts to export to acumen
            //only need to re-export to Acumen if the roster has been saved subsequent to last export.
            //will need option to delete Acumen shifts which means we should probably save the Acumen ID for each shift
            //this would also allow us to delete and edit individual shifts from Acumen
            //for each shift will need to track isDirty mean the cell was edited but not saved and
            //AcumenIsDirty meaning it was edited after the last Acumen export and not re-exported. Anytime the roster is edited 
            //after exporting to Acumen then Final Print should only be available after Approved is checked however this coulld
            //still result in a situation where a roster is Final Printed and posted, edited subsequently and Final Printed again
            //but not reposted.
            //Maybe after exporting to Acumen the roster should be read only and Systems has to contact if it needs to be edited and re-exported
            //so the shifts can be deleted from WorkingSchedules
            this.finalPrint();
        },
        menuoption_copyFrom: function() {
            /* This cannot be done if the roster has been approved or exported to acumen*/
            /* confirm with user that any existing shifts will be deleted */
            // $(this.$refs.deleteSchedulesDialog.$el).on('hidden.bs.modal', this.showCopyFromModal);
            $(this.$refs.deleteSchedulesDialog.$el.querySelector('#okbutton')).on('click', this.showCopyFromModal);
            $(this.$refs.deleteSchedulesDialog.$el).modal('show');
        },
        showCopyFromModal: function() {
            $(this.$refs.deleteSchedulesDialog.$el).modal('hide');
            $(this.$refs.deleteSchedulesDialog.$el.querySelector('#okbutton')).off('click');
            $(this.$refs.copyfromrosterDialog.$el).modal('show');
        },
        copyFromRoster: function(roster) {
            $(this.$refs.copyfromrosterDialog.$el).modal('hide');
            //delete all existing schedules
            this.removeSchedules();
            let copyfrom = new moment(roster.weekstarting, 'YYYY-MM-DD');
            this.loadRosterSchedulesFromCopy(copyfrom);
        },
        deleteSchedulesOKClicked: function() {
            $(this.$refs.deleteSchedulesDialog.$el).modal('hide');
            //$(this.$refs.copyfromrosterDialog.$el).modal('show');
        },
        removeSchedules: function() {
            for(let employee of this.employees) {
                for(let schedule of employee.schedules) {
                    if (schedule.shiftstring && schedule.rosterID == this.roster.id) { //This restricts the deletion to only shfits created in this roster
                    //if (schedule.shiftstring) {
                        schedule.rosterID = this.roster.id;
                        schedule.id = 0;
                        schedule.shiftstring = '';
                        schedule.setShifts();
                        //schedule.format('short');
                        schedule.isDirty = true;
                    }
                }
            };
            this.emitScheduleUpdated();
        },
        updateSchedules: function(schedules) {
            for(let savedschedule of schedules) {
                let employee = this.findEmployeeByEmpNo(savedschedule.emp_no);
                let scheduleindex = this.findScheduleIndexByWeekDate(savedschedule.date);
                if (employee && scheduleindex !== null) {
                    let schedule = employee.schedules[scheduleindex];
                    schedule.id = 0;
                    schedule.shiftstring = savedschedule.shiftstring;
                    schedule.setShifts();
                    schedule.format('short');
                    schedule.isDirty = true;
                }
            };
            this.emitScheduleUpdated();
        },
        menuoption_changeLocation: function(locID) {
            EventBus.$emit('CHANGE-LOCATION', locID);
        },
        menuoption_changePosition: function(position) {
            EventBus.$emit('CHANGE-POSITION', position);
        },
        menuoption_setExcuseCode: function(code) {
            EventBus.$emit('SET-EXCUSECODE', code);
        },
        missingCellsModalOKClicked: function() {
            $(this.$refs.missingCellsDialog.$el.querySelector('#missingCellsDialogOKButton')).off('click');
            $(this.$refs.missingCellsDialog.$el).modal('hide');
            this.exportToAcumen();
        },
        menuoption_print: function() {
            window.print();
        },
        menuoption_printdraft: function() {
            window.print();
        },
        menuoption_deleteAllShifts: function() {
            // $(this.$refs.deleteSchedulesDialog.$el).on('hidden.bs.modal', this.removeSchedules);
            $(this.$refs.deleteSchedulesDialog.$el.querySelector('#okbutton')).on('click', this.deleteAllShifts);
            $(this.$refs.deleteSchedulesDialog.$el).modal('show');
        },
        actionMenuOption: function(action) {
            EventBus.$emit('MENUOPTION-SELECTION', action);
        },
        menuoption_cut: function() {
            this.actionMenuOption('cut');
        },
        menuoption_copy: function() {
            this.actionMenuOption('copy');
        },
        menuoption_paste: function() {
            this.actionMenuOption('paste');
        },
        menuoption_showStats: function() {
            $(this.$refs.showstats.$el).modal('show');
        },
        menuoption_shortcuts: function() {
            $(this.$refs.shortcutsDialog.$el).modal('show');
        },
        menuoption_copyurl: function() {
            $('#rosterurl input').focus();
            $('#rosterurl input').select();
            document.execCommand('copy');
        },
        deleteAllShifts: function() {
            $(this.$refs.deleteSchedulesDialog.$el).modal('hide');
            $(this.$refs.deleteSchedulesDialog.$el.querySelector('#okbutton')).off('click');
            this.removeSchedules();
        },
        getPComment: function(code) {
            if (this.excusecodes) {
                for(let i = 0; i < this.excusecodes.length; i++) {
                    if (this.excusecodes[i].code === code) {
                        return this.excusecodes[i].pComment;
                    }
                }
            }
            return null;
        },
        extractPositions: function(positionsarray) {
            this.positions = [];
            this.patternpositions = [];
            for(let i = 0; i < positionsarray.length; i++) {
                let position = positionsarray[i].position;
                this.positions.push(position);
                if (position.includes(' ')) {
                    let parts = position.split(' ');
                    this.patternpositions.push(parts[1]);
                } else {
                    this.patternpositions.push(position);
                }
            }
            patterns.position = patterns.position.replace('~', this.patternpositions.join('|'));
        },
        modalOKClicked: function(event) {
            if (this.validate()) {
                this.setWeekstarting();
                this.setLocation();
                hideModal();
            }
        },
        setWeekstarting: function() {
            if (this.weekending) {
                this.weekstarting = moment(this.formatWeekending(), "MM/DD/YYYY").subtract(6, 'days');
            }
        },
        setLocation: function() {
            if (this.locID && this.weekending) {
                this.location = this.getLocation(this.locID);
            }
        },
        getLocation: function(locid) {
            for(let location of this.locations) {
                if (location.locID === locid) {
                    return location;
                }
            }
            return null;
        },
        formatWeekending: function() {
            let day = this.weekending.getDate();
            let month = this.weekending.getMonth() + 1;
            let year = this.weekending.getFullYear();
            if (day < 10) {
                day = `0${day}`;
            }
            if (month < 10) {
                month = `0${month}`;
            }
            return `${month}/${day}/${year}`;
        },
        selectEmployee: function(index) {
            this.editEmployeeIndex = index;
            if (this.deletedemployees.length > 0 || this.otheremployees.length > 0) {
                showSelectEmployeeModal();
            }
        },
        loadEmployeeSchedules: function(employee) {
            let url = `getemployeeschedules.php?emp_no=${employee.emp_no}&weekstarting=${this.weekstarting.format('YYYY-MM-DD')}`;
            return fetch(url)
            .then(response => response.json())
            .then(savedschedules => {
                this.showEmployeeSchedules(employee, savedschedules);
            })
        },
        showEmployeeSchedules: function(employee, savedschedules) {
            if (savedschedules) {
                for(let savedschedule of savedschedules) {
                    let scheduleindex = this.findScheduleIndexByWeekDate(savedschedule.date);
                    if (scheduleindex !== null) {
                        let schedule = employee.schedules[scheduleindex];
                        schedule.id = savedschedule.id;
                        schedule.rosterID = savedschedule.rosterID;
                        schedule.shiftstring = savedschedule.shiftstring;
                        schedule.setShifts();
                        schedule.format('short'); 
                    }
                }
            }
        },
        employeeSelected: function(employee) {
            //console.log('Employee selected');
            hideSelectEmployeeModal();
            this.employees[this.editEmployeeIndex].emp_no = employee.emp_no;
            this.employees[this.editEmployeeIndex].emp_fname = employee.emp_fname;
            this.employees[this.editEmployeeIndex].emp_lname = employee.emp_lname;
            this.employees[this.editEmployeeIndex].defaultLocation = employee.defaultLocation;
            if (employee.visitor) {
                this.employees[this.editEmployeeIndex].visitor = true;
                this.removeEmployee(this.otheremployees, employee);
            } else {
                this.removeEmployee(this.deletedemployees, employee);
            }
            //needs to load schedules for selected employee
            this.loadEmployeeSchedules(this.employees[this.editEmployeeIndex]);
            this.updatestats();
            this.editEmployeeIndex = -1;
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
        isValidLocation: function() {
            let retval = true;
            if (this.locID) {
                this.errors.location = false;
            } else {
                retval = false;
                this.errors.location = true;
            }
            return retval;
        },
        isValidWeekending: function() {
            let retval = true;
            if (this.weekending) {
                this.errors.weekending = false;
            } else {
                retval = false;
                this.errors.weekending = true;
            }
            return retval;
        },
        validate: function() {
            let isvalid = this.isValidLocation();
            isvalid = this.isValidWeekending() && isvalid;
            return isvalid;
        },
        locationChanged: function() {
            if (this.isValidLocation()){
                let location = this.getLocation(this.locID);
                let weekends = parseInt(location.weekends);
                this.disabledDates.days = [];
                for(let i = 0; i < 7; i++) {
                    if (i !== weekends - 1) {
                        this.disabledDates.days.push(i);
                    }
                }
            };
        },
        weekendingSelected: function() {
            this.isValidWeekending();
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
        handleCellHighlighting: function() {
            if (this.highlight.start && this.highlight.end) {
                let rowRange = this.orderValues(this.highlight.start.row, this.highlight.end.row);
                let colRange = this.orderValues(this.highlight.start.column, this.highlight.end.column);
                for(let i = rowRange.smaller; i <= rowRange.larger; i++) {
                    for (let j = colRange.smaller; j <= colRange.larger; j++) {
                        //console.log(`Emit for row: ${i}, column: ${j}`);
                        EventBus.$emit('HIGHLIGHT-CELL', {row: i, column: j});
                    }
                }
            }
        },
        orderValues: function(value1, value2)
        {
            value1 = parseInt(value1);
            value2 = parseInt(value2);
            if (value2 < value1)
            {
                var temp = value1,
                    value1 = value2,
                    value2 = temp;
            }
            return { smaller:value1, larger:value2 };
        },
        save: function() {
            //console.log('Save roster');
            this.saveRoster(false, true);
        },
        resetPatternsPosition: function() {
            // patterns.excusecode = '^(off(?:\\(r\\))?|~)$';
            // patterns.times = '(^(?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)\\s*-\\s*((?:0?\\d|1(?:0|1|2))(?:(\\:)?(?:0|3)0)?\\s*(?:a|p)m?)',
            // patterns.location = '(?:(?:\\s+)(?:@?)(~))';
            patterns.position = '(?:(?:\\s*)((?:#?)(rest|barn|dtru)?)?\\s?(~))';
            // patterns.time = '^(0?\\d|1(?:0|1|2))((?:(\\:)?)((?:0|3)0))?\\s*((?:a|p)m?)';
            // patterns.qualifier = '(rest|barn|dtru)';
            // patterns.comment = '(?:\\*\\*)([A-Za-z\\s]+)';
        },
        menuoption_new: function() {
            //reset the data options
            this.schedulesloaded = false;
            this.roster = null;
            this.sections = null;
            this.employees = null;
            this.savedschedules = null;
            this.positionQualifiers = null;
            this.excusecodes = null;
            this.location = null;
            this.locID = '';
            this.weekending = null;
            this.weekstarting = null;
            this.positions = [];
            this.nomissingcells = 0;
            this.noinvalidcells = 0;
            this.totalhours = 0;
            this.loanedhours = 0;
            this.agreedhours = 0;
            this.additionalhours = 0;
            this.deletedemployees = [];
            this.deletedEmployeeIDs = [];
            this.otheremployees = [];
            this.editEmployeeIndex = -1;
            this.editdata = null;
            this.locationsqualifiers = [];
            this.errors.location = false;
            this.errors.weekending = false;
            this.contextMenuEnabled = false;
            this.highlight.start = null;
            this.highlight.end = null;
            this.approvedrosters = [];
            this.hoursexceeded = 0;
            this.hoursexceeded_shiftstring = '';
            this.hoursexceeded_cell = null;
            this.saveconflicts = null;
            this.resetPatternsPosition();
            this.validate();
            showStartupModal();
        },
        emitScheduleUpdated: function() {
            EventBus.$emit('SCHEDULE-UPDATED');
        },
        isValidRosteredAtLocation: function(target) {
            let regex = new RegExp(this.location.rosteredat, 'gi');
            return regex.test(target.type);
        },
        chooseShift: function(eventdata) {
            this.shiftchoices.cell = eventdata.cell;
            this.shiftchoices.choices = eventdata.choices;
            $(this.$refs.selectshiftDialog.$el).modal('show');
        },
        shiftSelected: function(shift) {
            $(this.$refs.selectshiftDialog.$el).modal('hide');
            EventBus.$emit('SHIFT-CHOSEN', { cell: this.shiftchoices.cell, shift: shift});
        },
        findSectionByName: function(name) {
            for(let section of this.sections) {
                if (section.name === name) {
                    return section;
                }
            }
        },
        moveEmployee(employee, sectionname) {
            let deleteindex = this.findEmployeeIndexByEmpNo(employee.emp_no);
            let section = this.findSectionByName(sectionname);
            if (employee.sectionsDefID !== section.id) {
                this.employees.splice(deleteindex, 1);
                employee.sectionsDefID = section.id;
                this.addEmployee(section, employee);
            }
        }
    },
    created: function() {
        let url = `getlocations-2.php`;
        fetch(url)
        .then(response => response.json())
        .then(json => {
            this.locations = json;
            data.locations = json;
        });
        url = 'getoptions.php';
        fetch(url)
        .then(response => response.json())
        .then(json => {
            this.options = json;
        });
    },
    mounted: function() {
        EventBus.$on('CELL-HIGHLIGHT-START', (cell) => {
           //console.log(`Highlight started with row: ${cell.row}, column: ${cell.column}`);
            this.highlight.start = cell;
        });
        EventBus.$on('CELL-HIGHLIGHT-END', (cell) => {
            //console.log(`Highlight ended with row: ${cell.row}, column: ${cell.column}`);
            this.highlight.end = cell;
            this.handleCellHighlighting();
        });
        EventBus.$on('CELL-UNHIGHLIGHTED', () => {
            this.highlight.start = null;
            this.highlight.end = null;
        });
        EventBus.$on('ARROW-RIGHT', (cell) => {
            let target = { row: cell.row, column: cell.column }
            if (cell.column < 7) {
                target.column = cell.column + 1
            } else if (cell.column === 7) {
                target.row = cell.row + 1;
                target.column = 1;
            }
            EventBus.$emit('TAKE-FOCUS', target);
        });
        EventBus.$on('ARROW-LEFT', (cell) => {
            let target = { row: cell.row, column: cell.column }
            if (cell.column > 1) {
                target.column = cell.column - 1
            } else if (cell.column === 1) {
                target.row = cell.row - 1;
                target.column = 7;
            }
            EventBus.$emit('TAKE-FOCUS', target);
        });
        EventBus.$on('ARROW-DOWN', (cell) => {
            let target = { row: cell.row, column: cell.column }
            target.row = cell.row + 1;
            EventBus.$emit('TAKE-FOCUS', target);
        });
        EventBus.$on('ARROW-UP', (cell) => {
            let target = { row: cell.row, column: cell.column }
            target.row = cell.row - 1;
            EventBus.$emit('TAKE-FOCUS', target);
        });
        EventBus.$on('HOURS-EXCEEDED', (eventdata) => {
            this.hoursexceeded = data.location.maximumshift;
            this.hoursexceeded_shiftstring = eventdata.schedule.shiftstring;
            this.hoursexceeded_cell = eventdata.cell;
            $(this.$refs.maximumHoursExceededDialog.$el).modal('show');
        });
        EventBus.$on('CUTORCOPY', (text) => {
            this.texttopaste = true;
            data.clipboard = text;
        });
        EventBus.$on('CHOOSE-SHIFT', (eventdata) => {
            this.chooseShift(eventdata)
        });
        EventBus.$on('MOVE-EMPLOYEE', (eventdata) => {
            this.moveEmployee(eventdata.employee, eventdata.sectionname);
        })

    }
    // updated: function(){
    //     this.$nextTick(function() {
    //         this.showRowNumbers();
    //     })
    // }
})