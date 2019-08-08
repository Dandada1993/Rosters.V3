<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $rosterid = $parameters['rosterid'];

    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_exporttoAcumen');
    $database->addParameter('rosterid', $rosterid, PDO::PARAM_STR);
    $results = $database->execute_noresult();  //execute_noresult(); //returns and array each element being a returned dataset
    $database->release();