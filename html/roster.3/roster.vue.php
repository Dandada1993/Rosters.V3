<?php
    require 'getlocations.php';

    $locations = getlocations();
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
    <div id="main">
        <div id="top" v-if="location && weekending">
            <div>
                <span class="left">
                    <h2>{{location.name}} (week ending: {{weekendingDisplay}})</h2>
                </span>
                <span class="right">
                    <!-- <div><h4 class="stats title">Missing cells:</h4><h4 class="stats data" v-on:update-hours="updatestats()">{{nomissingcells}}</h4></div>
                    <div><h4 class="stats title">Invalid cells:</h4><h4 class="stats data" v-on:update-hours="updatestats()">{{noinvalidcells}}</h4></div> -->
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
                        <td class="col header shift" data-col="4">Wednesday</td>
                        <td class="col header shift" data-col="5">Thursday</td>
                        <td class="col header shift" data-col="6">Friday</td>
                        <td class="col header shift" data-col="7">Saturday</td>
                        <td class="col header shift" data-col="8">Sunday</td>
                        <td class="col header shift" data-col="9">Monday</td>
                        <td class="col header shift" data-col="10">Tuesday</td>
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
                        <tr class="rosterrow">
                            <td class="title">Agreed to hours</td>
                            <td class="data number">{{agreedhours}}</td>
                        </tr>
                        <tr class="rosterrow">
                            <td class="title">Difference</td>
                            <td class="data number">{{difference}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div id="selectLocations-dialog" class="modal fade" tabindex=-1 role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Select location and week ending</h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="selectlocations-dropdown">Location</label>
                            <select class="form-control" id="selectlocations-dropdown" v-on:change="locationChanged">
                                <option value="" disabled selected>Select location</option>
                                <option v-for="loc in locations" :value="loc.locID">{{loc.name}}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="weekending-input">Weekending</label>
                            <div class='input-group date' id='weekending'>
                                <input id="weekending-input" type='text' class="form-control" autocomplete="off"/>
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar">
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <button id="selectlocations-button" type="button" class="btn btn-primary" v-on:click="modalOKClicked">OK</button>
                    </div>
                </div>
            </div>
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
    </div>
    <script src="/js/jquery-3.3.1.js"></script>
    <script src="/js/jquery.timepicker.min.js"></script>
    <script src="/js/bootstrap.min.js"></script>
    <script src="/js/bootstrap-datepicker.min.js"></script>
    <script src="/js/moment.js"></script>
    <script src="/js/axios.min.js"></script>
    <script src="/js/vue.js"></script>
    <script src="/js/roster-3.2-vue.js"></script>
</body>
</html>