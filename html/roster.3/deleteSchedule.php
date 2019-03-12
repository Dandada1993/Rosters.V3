<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $emp_no = $parameters['emp_no'];
    $date = $parameters['date'];
    $islive = $parameters['islive'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_deleteSchedule');
    $database->addParameter('emp_no', $emp_no, PDO::PARAM_STR);
    $database->addParameter('Date', $date, PDO::PARAM_STR);
    $database->addParameter('isLive', $islive, PDO::PARAM_STR);
    $results = $database->execute_noresult(); //returns and array each element being a returned dataset
    $database->release();
    //echo json_encode($results[0]);