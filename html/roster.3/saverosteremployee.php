<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $rostersID = $parameters['rostersID'];
    $emp_no = $parameters['emp_no'];
    $defaultposition = $parameters['defaultposition'];
    $defaultqualifier = $parameters['defaultqualifier'];
    $sectionsdefid = $parameters['sectionsdefid'];

    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_addrosteremployee');
    $database->addParameter('rostersID', $rostersID, PDO::PARAM_STR);
    $database->addParameter('emp_no', $emp_no, PDO::PARAM_STR);
    $database->addParameter('defaultPosition', $defaultposition, PDO::PARAM_STR);
    $database->addParameter('defaultQualifier', $defaultqualifier, PDO::PARAM_STR);
    $database->addParameter('sectionsDefID', $sectionsdefid, PDO::PARAM_STR);
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);