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
    <link rel="stylesheet" type="text/css" href="/css/roster-3.0.css">
</head>
<body>
    <textarea id="pastetext" style="display: none;" ></textarea>
    <div id="main">
        <?php
            echo "<input type=\"text\" id=\"locID\" value=\"$locID\" style=\"display: none;\"/>";
            echo "<input type=\"text\" id=\"weekending\" value=\"$weekending\" style=\"display: none;\"/>";
        ?>
        <nav class="navbar navbar-default">
            <div class="container-fluid">
                <div class="navbar-header">
                    <a class="navbar-brand" href="#">Roster Manager</a>
                </div>
                <div class="collapse navbar-collapse">
                    <ul class="nav navbar-nav">
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="False">File
                                <span class="caret"></span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a href="#" v-on:click="save">Save</a></li>
                                <li><a href="#">Change End Date</a></li>
                                <li class="divider"></li>
                                <li><a href="#" v-on:click="menuoption_print">Print</a></li>
                                <li><a href="#">Send for Approval</a></li>
                                <li><a href="#">Approve</a></li>
                                <li class="divider"></li>
                                <li><a href="#" v-on:click="menuoption_exportToAcumen">Export to Acumen</a></li>
                            </ul>
                        </li>
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="False">Help
                                <span class="caret"></span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">Tips and Tricks</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        <div id="top" v-if="location && weekending">
            <div>
                <span class="left">
                    <h2>{{location.name}} (week ending: {{weekendingDisplay}})</h2>
                </span>
                <span class="right">
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
                </span>
            </div>
        </div>
        <div v-if="sections">
            <table>
                <tbody>
                    <tr class="rosterrow" data-row="0">
                        <td class="col rowheader header" data-col="1">&nbsp;</td>
                        <td class="col header name" data-col="2">Name</td>
                        <td class="col header position" data-col="3">Position</td>
                        <td class="col header shift" data-col="4"><span class="longname">Wednesday</span><span class="shortname">Wed</span></td>
                        <td class="col header shift" data-col="5"><span class="longname">Thursday</span><span class="shortname">Thu</span></td>
                        <td class="col header shift" data-col="6"><span class="longname">Friday</span><span class="shortname">Fri</span></td>
                        <td class="col header shift" data-col="7"><span class="longname">Saturday</span><span class="shortname">Sat</span></td>
                        <td class="col header shift" data-col="8"><span class="longname">Sunday</span><span class="shortname">Sun</span></td>
                        <td class="col header shift" data-col="9"><span class="longname">Monday</span><span class="shortname">Mon</span></td>
                        <td class="col header shift" data-col="10"><span class="longname">Tuesday</span><span class="shortname">Tue</span></td>
                        <td class="col header hours" data-col="11">Hours</td>
                    </tr>
                </tbody>
            </table>
            <div is="rostersection" 
                class="section" 
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
            <div class="rostertotals">
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
                                <option v-for="loc in locations" :value="loc.locID">{{loc.name}}</option>
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
        <ul ref="contextMenu" id="contextMenu" class="dropdown-menu" role="menu" style="display:none" >
            <li><a tabindex="-1" href="#">Cut</a></li>
            <li><a tabindex="-1" href="#">Copy</a></li>
            <li :class="{'contextmenu-disabled' : clipboardEmpty()}"><a tabindex="-1" href="#" >Paste</a></li>
            <li class="divider"></li>
            <li class="dropdown-header">EXCUSE CODES</li>
            <!-- <li><a tabindex="-1" href="#">OFF</a></li>
            <li><a tabindex="-1" href="#">OFF(R)</a></li>
            <li><a tabindex="-1" href="#">SL</a></li>
            <li><a tabindex="-1" href="#">IL</a></li>
            <li><a tabindex="-1" href="#">VAC</a></li> -->
            <li v-for="excuse in excusecodes" v-if="excusecodes"><a tabindex="-1" href="#">{{excuse.code}}</a></li>
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