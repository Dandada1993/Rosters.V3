<?php
    require 'acceptparameters.php';
    $locID = isset($parameters["locid"]) ? $parameters["locid"] : null;
    $weekending = isset($parameters["weekending"]) ? $parameters["weekending"] : null;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Roster</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/css/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="/css/jquery.timepicker.min.css" />
    <link rel="stylesheet" type="text/css" href="/css/bootstrap-datepicker.min.css">
    <link rel="stylesheet" type="text/css" href="/css/bootstrap-3-submenu.css">
    <link rel="stylesheet" type="text/css" href="/css/roster-3.0.css">
</head>
<body>
    <textarea id="pastetext" style="display: none;" ></textarea>
    <div id="main">
        <?php
            echo "<input type=\"text\" id=\"locID\" value=\"$locID\" style=\"display: none;\"/>";
            echo "<input type=\"text\" id=\"weekending\" value=\"$weekending\" style=\"display: none;\"/>";
        ?>
        <nav class="navbar navbar-default navbar-fixed-top">
            <div class="container-fluid">
                <div class="navbar-header">
                    <a class="navbar-brand">Roster Manager</a>
                </div>
                <div class="collapse navbar-collapse">
                    <ul class="nav navbar-nav">
                        <li class="dropdown">
                            <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="False">Roster
                                <span class="caret"></span>
                            </a>
                            <ul class="dropdown-menu">
                                <!-- <template v-if="roster"> -->
                                <li><a v-on:click="menuoption_new">New</a></li>
                                <li class="divider"></li>
                                <li :disabled="!roster || roster.exportedToAcumen === '1'" v-on:click="menuoption_copyFrom"><a >Copy From</a></li>
                                <!-- </template> -->
                                <li><a v-on:click="save">Save</a></li>
                                <li class="divider"></li>
                                <template v-if="location && location.autoApprove === '0'">
                                    <li><a v-on:click="menuoption_printdraft">Print Draft</a></li>
                                </template>
                                <template v-if="location && location.autoApprove === '1'">
                                <li><a v-on:click="menuoption_print">Print</a></li>
                                </template>
                                <template v-if="location && location.autoApprove === '0'">
                                    <li><a >Send for Approval</a></li>
                                    <li><a >Approve</a></li>
                                </template>
                                <li class="divider"></li>
                                <template v-if="location && location.autoApprove === '1'">
                                    <li><a v-on:click="menuoption_exportToAcumen">Export to Acumen</a></li>
                                </template>
                                <template v-if="location && location.autoApprove === '0'">
                                    <li><a v-on:click="menuoption_finalPrint">Final Print</a></li>
                                </template>
                                <!-- <li><a v-on:click="menuoption_test(location.locID)">Test</a></li> -->
                            </ul>
                        </li>
                        <li class="dropdown">
                            <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="False">Shifts
                                <span class="caret"></span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a >Cut</a></li>
                                <li><a >Copy</a></li>
                                <li><a >Paste</a></li>
                                <li class="divider"></li>
                                <li><a v-on:click="menuoption_deleteAllShifts">Delete All</a></li>
                                <li class="divider"></li>
                                <li v-if="locations" class="dropdown-submenu">
                                    <a tabindex="-1" >Set Location</a>
                                    <ul class="dropdown-menu">
                                        <template v-if="location">
                                            <li v-for="loc in locations" v-if="isValidRosteredAtLocation(loc)"><a v-on:click="menuoption_changeLocation(loc.locID)">{{loc.name}}</a></li>
                                        </template>
                                    </ul>
                                </li>
                                <li class="dropdown-submenu" :disabled="positions && positions.length === 1">
                                    <a tabindex="-1">Set Position</a>
                                    <ul class="dropdown-menu">
                                        <li v-for="position in positions" :disabled="positions.length === 1"><a v-on:click="menuoption_changePosition(position)">{{position}}</a></li>
                                    </ul>
                                </li>
                                <li class="dropdown-submenu">
                                    <a tabindex="-1" >Set Excuse Code</a>
                                    <ul class="dropdown-menu">
                                        <template v-if="excusecodes">
                                        <li v-for="excuse in excusecodes" ><a v-on:click="menuoption_setExcuseCode(excuse.code)">{{excuse.name}}</a></li>
                                        </template>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                        <li class="dropdown">
                            <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="False">Help
                                <span class="caret"></span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a >Documentation</a></li>
                                <li><a href="tipstricks.html" target="_blank">Tips and Tricks</a></li>
                                <li><a >Show Shortcuts</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        <div id="top" v-if="location && weekending" class="container-fluid">
            <div class="row">
                <div class="col-md-6">
                    <h2>{{location.name}} (week ending: {{weekendingDisplay}})</h2>
                </div>
                <div class="col-md-3">
                    <table class="legend" v-if="location">
                        <tbody>
                            <tr>
                                <td class="data invalid">&nbsp;</td>
                                <td class="title">Invalid shifts</td>
                                <td class="data visiting" v-show="location.showvisitingemployees === '1'">&nbsp;</td>
                                <td class="title" v-show="location.showvisitingemployees === '1'">Visiting employee</td>
                            </tr>
                            <tr>
                                <td class="data toolong">&nbsp;</td>
                                <!-- <td class="title">Over {{location.maximumshift}} hours</td> -->
                                <td class="title">Maybe invalid</td>
                                <td class="data onloan" v-show="location.showloanedemployees === '1'">&nbsp;</td>
                                <td class="title"  v-show="location.showloanedemployees === '1'">Employee on loan</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-3">
                    <div class="right">
                        <table class="stats">
                            <tbody>
                                <tr>
                                    <td class="title">Missing cells</td>
                                    <td class="data number">{{nomissingcells}}</td>
                                </tr>
                                <tr>
                                    <td class="title">Invalid cells</td>
                                    <td class="data number">{{noinvalidcells}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="sections" class="container-fluid">
            <div class="row">
                <!-- <div class="col-md-12"> -->
                    <table class="rosterheader table-bordered">
                        <tbody>
                            <tr data-row="0">
                                <td class="col rowheader header" data-col="1" rowspan="2">&nbsp;</td>
                                <td class="col header name" data-col="2" rowspan="2">Names</td>
                                <td class="col header position" data-col="3" rowspan="2">Default Position</td>
                                <td class="col header shift" data-col="4"><span class="longname">{{displayDayNameLong(1)}}</span><span class="shortname">{{displayDayNameShort(1)}}</span></td>
                                <td class="col header shift" data-col="5"><span class="longname">{{displayDayNameLong(2)}}</span><span class="shortname">{{displayDayNameShort(2)}}</span></td>
                                <td class="col header shift" data-col="6"><span class="longname">{{displayDayNameLong(3)}}</span><span class="shortname">{{displayDayNameShort(3)}}</span></td>
                                <td class="col header shift" data-col="7"><span class="longname">{{displayDayNameLong(4)}}</span><span class="shortname">{{displayDayNameShort(4)}}</span></td>
                                <td class="col header shift" data-col="8"><span class="longname">{{displayDayNameLong(5)}}</span><span class="shortname">{{displayDayNameShort(5)}}</span></td>
                                <td class="col header shift" data-col="9"><span class="longname">{{displayDayNameLong(6)}}</span><span class="shortname">{{displayDayNameShort(6)}}</span></td>
                                <td class="col header shift" data-col="10"><span class="longname">{{displayDayNameLong(7)}}</span><span class="shortname">{{displayDayNameShort(7)}}</span></td>
                                <td class="col header hours" data-col="11" rowspan="2">Hours</td>
                            </tr>
                            <tr class="secondary" data-row="0">
                                <!-- <td class="col rowheader header" data-col="1">&nbsp;</td> -->
                                <!-- <td class="col header name" data-col="2">{{month}}</td> -->
                                <!-- <td class="col header position" data-col="3">&nbsp;</td> -->
                                <td class="col header shift" data-col="4">{{displayDayDate(1)}}</td>
                                <td class="col header shift" data-col="5">{{displayDayDate(2)}}</td>
                                <td class="col header shift" data-col="6">{{displayDayDate(3)}}</td>
                                <td class="col header shift" data-col="7">{{displayDayDate(4)}}</td>
                                <td class="col header shift" data-col="8">{{displayDayDate(5)}}</td>
                                <td class="col header shift" data-col="9">{{displayDayDate(6)}}</td>
                                <td class="col header shift" data-col="10">{{displayDayDate(7)}}</td>
                                <!-- <td class="col header hours" data-col="11">&nbsp;</td> -->
                            </tr>
                        </tbody>
                    </table>
                <!-- </div> -->
            </div>
            <div class="row">
                <div is="rostersection" 
                    class="section table-responsive" 
                    v-for="(section, index) in sections" 
                    :section="section" 
                    :employees="employees"
                    :positions="positions"
                    :qualifiers="getQualifiers(section.defaultPosition)"
                    :key="index" 
                    v-on:hours-updated="hoursUpdated()"
                    v-on:add-employee="addEmployee"
                    v-on:delete-employee="deleteEmployee"
                    v-on:select-employee="selectEmployee"
                    v-on:enter-shifts="enterShifts">
                </div>
            </div>
            <div class="col-md-12 rostertotals">
                <div class="row">
                    <table>
                        <tbody>
                            <tr class="rosterrow">
                                <td class="title">Total hours</td>
                                <td class="data number">{{totalhours}}</td>
                            </tr>
                            <tr class="rosterrow" v-if="agreedhours > 0">
                                <td class="title">Agreed to hours</td>
                                <td class="data number">{{agreedhours}}</td>
                            </tr>
                            <tr class="rosterrow" v-if="agreedhours > 0">
                                <td class="title">Difference</td>
                                <td class="data number">{{difference}}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div ref="selectLocations-dialog" id="selectLocations-dialog" class="modal fade" tabindex=-1 role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Select location and week ending</h4>
                        <h5 class="haserrors" v-show="errors.has()"><span><strong>The fields marked red are required</strong></span></h5>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" :class="{haserrors: errors.location}">
                            <label for="selectlocations-dropdown">Location</label>
                            <select class="form-control" id="selectlocations-dropdown" v-model="locID" v-on:change="locationChanged">
                                <option value="" disabled selected>Select location</option>
                                <option v-for="loc in locations" v-if="loc.rosterrequired === '1'" :value="loc.locID">{{loc.name}}</option>
                            </select>
                        </div>
                        <div class="form-group" :class="{haserrors: errors.weekending}"> 
                            <label for="weekending-input">Weekending</label>
                            <div 
                                is="datepicker" 
                                id="weekending-input"
                                input-class="form-control" 
                                format="MM/dd/yyyy"
                                :disabled-dates="disabledDates"
                                v-model="weekending"
                                v-on:closed="weekendingSelected"
                                placeholder="Click to select weekending date">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="selectlocations-button" type="button" class="btn btn-primary" v-on:click="modalOKClicked">OK</button>
                    </div>
                </div>
            </div>
        </div>
        <div ref="missingCellsDialog" 
            is="genericdialog"
            show-cancel
            handle="missing-cells"
            title="Shifts missing or invalid">
            <template slot="body">
                <div class="form-group">
                    <p v-if="nomissingcells > 0">There <span v-if="nomissingcells > 1">are</span><span v-else>is</span> 
                    <strong>{{nomissingcells}}</strong> missing shift<span v-if="nomissingcells > 1">s</span>.</p>
                    <p v-if="noinvalidcells > 0"><p>There <span v-if="noinvalidcells > 1">are</span><span v-else>is</span> 
                    <strong>{{noinvalidcells}}</strong> invalid cell<span v-if="noinvalidcells > 1">s</span>.</p>
                    <p>Are you sure you want to continue to export to Acumen?</p>
                </div>
            </template>
            <template slot="btn_ok">
                <button type="button" class="btn btn-primary" v-on:click="missingCellsModalOKClicked">Proceed</button>
            </template>
        </div>
        <div is="selectemployee"
            :deletedemployees="deletedemployees"
            :otheremployees="otheremployees"
            v-on:employee-selected="employeeSelected"
        ></div>
        <div is="shiftentry" v-if="location && editdata"
            :location="location"
            :employee="editdata.employee"
            :schedule="editdata.schedule"
            :locations="locations"
            :locationsqualifiers="locationsqualifiers"
            v-on:hours-updated="hoursUpdated()"
        ></div>
        <div is="copyfromroster"
            ref="copyfromrosterDialog"
            :approvedrosters="approvedrosters"
            v-on:copyfromweekending="copyFromRoster">
        </div>
        <div ref="deleteSchedulesDialog" 
            is="genericdialog"
            show-cancel
            handle="delete-schedules"
            title="Existings shifts will be deleted">
            <template slot="body">
                <div class="form-group">
                    <p >All existing shifts will be deleted.</p>
                    <p>Are you sure you want to continue?</p>
                </div>
            </template>
            <template slot="btn_ok">
                <button id="okbutton" type="button" class="btn btn-primary">Proceed</button>
            </template>
        </div>
        <div ref="resultAcumenExportDialog" 
            is="genericdialog"
            show-cancel
            handle="acumen-export"
            :title="acumenexport.title">
            <template slot="body">
                <div class="form-group">
                    <p>{{acumenexport.body}}</p>
                </div>
            </template>
        </div>
        <div ref="maximumHoursExceededDialog" is="maxhoursexceeded" :hours="hoursexceeded" :shiftstring="hoursexceeded_shiftstring" :cell="hoursexceeded_cell"></div>
        <ul ref="contextMenu" id="contextMenu" class="dropdown-menu" role="menu" style="display:none" >
            <li><a tabindex="-1">Cut</a></li>
            <li><a tabindex="-1">Copy</a></li>
            <li :class="{'contextmenu-disabled' : clipboardEmpty()}"><a tabindex="-1">Paste</a></li>
            <li class="divider"></li>
            <li class="dropdown-header">EXCUSE CODES</li>
            <li v-for="excuse in excusecodes" v-if="excusecodes"><a tabindex="-1">{{excuse.code}}</a></li>
        </ul>
    </div>
    <script src="/js/jquery-3.3.1.js"></script>
    <script src="/js/bootstrap.min.js"></script>
    <script src="/js/moment.js"></script>
    <script src="/js/axios.min.js"></script>
    <script src="/js/vue.js"></script>
    <script src="/js/vuejs-datepicker.min.js"></script>
    <script src="/js/roster-3.2-vue.js"></script>
    
</body>
</html>