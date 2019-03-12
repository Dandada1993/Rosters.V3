<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $emp_no = $parameters['emp_no'];
    $pComment = $parameters['pComment'];
    $date = $parameters['date'];
    $islive = $parameters['islive'];

    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_insertExcuseCode');
    $database->addParameter('emp_no', $emp_no, PDO::PARAM_STR);
    $database->addParameter('date', $date, PDO::PARAM_STR);
    $database->addParameter('pComment', $pComment, PDO::PARAM_STR);
    $database->addParameter('isLive', $islive, PDO::PARAM_STR);
    $results = $database->execute_noresult(); //returns and array each element being a returned dataset
    $database->release();