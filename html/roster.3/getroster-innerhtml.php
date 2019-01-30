<?php
    //require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $locID = $parameters['locID'];
    $weekstarting = $parameters['weekstarting'];

    function callRosterSP($sp, $locID, $weekstarting)
    {
        global $serverName, $dbname, $userid, $password;
        $database = new database($serverName, $dbname, $userid, $password);
        $database->execProcedure("tareports.roster.$sp");
        $database->addParameter('locID', $locID, PDO::PARAM_STR);
        $database->addParameter('weekstarting', $weekstarting, PDO::PARAM_STR);
        $results = $database->execute(); //returns and array each element being a returned dataset
        $database->release();
        return json_decode(json_encode($results[0]));
    }

    function getRoster($locID, $weekstarting) 
    {
        return callRosterSP('cp_getroster', $locID, $weekstarting);
    }

    function getSections($locID, $weekstarting) 
    {
        return callRosterSP('cp_getsections', $locID, $weekstarting);
    }

    function getEmployees($locID, $weekstarting)
    {
        return callRosterSP('cp_getrosteremployees', $locID, $weekstarting);
    }

    function getRosterShifts($locID, $weekstarting)
    {
        return callRosterSP('getrostershifts', $locID, $weekstarting);
    }

    function getSectionEmployees($sectionID, $employees)
    {
        //given a list of employees and sections finds the employees that belong to that section
    }

    $roster = getRoster($locID, $weekstarting);
    $sections = getSections($locID, $weekstarting);
    $employees = getEmployees($locID, $weekstarting);
    $shifts = getRosterShifts($locID, $weekstarting);

