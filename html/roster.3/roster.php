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
    <link rel="stylesheet" type="text/css" href="/css/bootstrap-datepicker.min.css">
    <link rel="stylesheet" type="text/css" href="/css/roster-3.0.css">
</head>
<body>
    <div id="top">
        <h2></h2>
    </div>
    <div id="main"></div>
    <div id="selectLocations-dialog" class="modal fade" tabindex=-1 role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Select location and week ending</h4>
                </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="selectlocations-dropdown">Locations</label>
                    <select class="form-control" id="selectlocations-dropdown">
                        <option value="" disabled selected>Select location</option>
                        <?php
                            foreach($locations as $location)
                            {
                                echo "<option value=\"{$location['locID']}\">{$location['name']}</options>";
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="weekending-input">Weekending</label>
                    <div class='input-group date' id='weekending'>
                        <input id="weekending-input" type='text' class="form-control" />
                        <span class="input-group-addon">
                            <span class="glyphicon glyphicon-calendar">
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button id="selectlocations-button" type="button" class="btn btn-primary">OK</button>
            </div>
            </div>
        </div>
    </div>
    <script src="/js/jquery-3.3.1.js"></script>
    <script src="/js/bootstrap.min.js"></script>
    <script src="/js/bootstrap-datepicker.min.js"></script>
    <script src="/js/moment.js"></script>
    <script src="/js/axios.min.js"></script>
    <script src="/js/roster-3.0.js"></script>
</body>
</html>