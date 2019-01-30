<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of drawcalendar
 *
 * @author Ralph
 */
class HTMLcalendar {
    /*
     * Should have an option for the format of the month e.g. Jan vs January. Discontinue the 
     * use of monthnames and use the DateTime->format function to get the names based on the 
     * format property i.e.
     * F - A full textual representation of a month, such as January or March, January through December
     * m - Numeric representation of a month, with leading zeros 01 through 12
     * M - A short textual representation of a month, three letters Jan through Dec
     * n - Numeric representation of a month, without leading zeros
     */
    private $calstart;
    private $calend;
    private $data;
    private $months = array();
    private $days = array();
    private $newline = "\r\n";
    
    public $monthnames = array("January", "February", "March", "April", "May", "June", "July", "August", "September" ,"October", "November", "December");
    public $markfuturedates = true;
    public $monthformat = 'M';

    public function __construct($calstart, $calend, $data){
        /*
         * $calstart - date string
         * $calend - date string
         * $data should be an associative array with data formatted as m/d/Y for the keys and the
         * value as the data to be shown for that given date. The value can be HTML
         */
        $this->calstart = new DateTime($calstart);
        $this->calend = new DateTime($calend);
        $this->data = $data;
        $this->getmonths();
    }
    
    private function month(DateTime $date){
        return (int) $date->format('m');
    }
    
    private function day(DateTime $date){
        return (int) $date->format('d');
    }
    
    private function year(DateTime $date){
        return (int) $date->format('Y');
    }
    
    private function daysinmonth($month, $year){
        $date = new DateTime();
        $date->setDate($year, $month, 1);
        return $date->format('t');
    }
    
    private function futuredate(DateTime $date)
    {
        $today = new DateTime();
        if ($date > $today){
            return true;
        }else{
            return false;
        }
    }

    private function getmonths(){
        /*
         * This gets the each month.year contained in the calstart and calend range
         */
        $ptr = clone $this->calstart;
        $curmonth = $this->month($ptr);
        $curyear = $this->year($ptr);
        $this->months[] = "$curmonth.$curyear";
        $ptr->add(new DateInterval('P1D'));
        while ($ptr != $this->calend){
            if ($this->month($ptr) !== $curmonth){
                $curmonth = $this->month($ptr);
                $curyear = $this->year($ptr);
                $this->months[] = "$curmonth.$curyear";
            }
            $ptr->add(new DateInterval('P1D'));
        }
    }

    private function nummonths(){
        return count($this->months);
    }

    private function getoffset($month, $year){
        $date = new DateTime();
        $date->setDate($year, $month, 1);
        return $date->format('w');
    }
    
    public function monthsByDow($id, $dow = array("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"))
    {
        $html = array();
        $numrows = 38;
        $html[] = "{$this->newline}<table id=\"$id\">{$this->newline}<thead>{$this->newline}<tr>";
        //Header rows
        for($i = 0; $i < $numrows; $i++)
        {
            if ($i === 0){
                $html[] = "<th>&nbsp;</th>";
            }elseif ($i === $numrows - 1){
                $j = ($i - 1) % 7;
                $html[] = "<th>$dow[$j]</th>";
            }else{
                $j = ($i - 1) % 7;
                $html[] = "<th class=\"header\">$dow[$j]</th>";
            }
        }
        $html[] = "</tr>{$this->newline}</thead>"; //end of thead section
        $html[] = "<tbody>";
        $monthnames = array("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC");
        //$daterange = new dateRange($startdate, $enddate);
        //Detail rows
        for($i = 0; $i < $this->nummonths(); $i++) //one row for each month, year contained in the startdate to enddate range
        {
            $monthyear = explode('.', $this->months[$i]);
            $month = $monthyear[0];
            $year = $monthyear[1];
            $offset = $this->getoffset((int)$month, (int)$year) + 1;
            $html[] = "<tr>";  // This row will contain the month abbreviation and the day number
            for($j = 0; $j < $numrows; $j++)
            {
                if ($j < $offset){ //$offset represents where the month data starts
                    if (($j + 1) === $offset){ //preceed the month data with the month header
                        $html[] = "<td class=\"monthheader\">".$monthnames[$month-1];
                    }else{
                        $html[] = "<td class=\"blank\">&nbsp;";
                    }
                }elseif($j >= $this->daysinmonth((int)$month, (int)$year) + $offset) {
                    $html[] = "<td class=\"blank\">&nbsp;";
                }else{
                    $day = $j - $offset + 1;
                    $date = new DateTime();
                    $date->setDate((int) $year, (int) $month, $day);
                    if ($this->futuredate($date)){
                        $html[] = "<td class=\"date futuredate\">$day"; 
                    }else{
                        $html[] = "<td class=\"date\">$day"; 
                    }
                }
                $html[] = "</td>";
            }
            $html[] = "</tr>";
            $html[] = "<tr>"; //This row will contain the year and the attendance code
            for($j = 0; $j < $numrows; $j++)
            {
                if ($j < $offset){
                    if (($j + 1) === $offset){
                        $html[] = "<td class=\"monthheader\">$year";
                    }else{
                        if ($i === $this->nummonths() - 1){
                            $html[] = "<td class=\"bottomcell blank\">&nbsp;";
                        }else{
                            $html[] = "<td class=\"blank\">&nbsp;";
                        }
                    }
                }elseif($j >= $this->daysinmonth((int)$month, (int)$year) + $offset) {
                    if ($i === $this->nummonths() - 1){
                        $html[] = "<td class=\"bottomcell blank\">&nbsp;";
                    }else{
                        $html[] = "<td class=\"blank\">&nbsp;";
                    }
                }else{
                    $date = new DateTime();
                    $date->setDate((int) $year, (int) $month, $j - $offset + 1);
                    $id = "id=\"{$date->format("Y-m-d")}\"";
                    if ($this->futuredate($date)){
                        $html[] = "<td class=\"datacell futuredate\" $id>&nbsp;"; 
                    }else{
                        if (array_key_exists($date->format("m/d/Y"), $this->data)){
                            $html[] = "<td class=\"datacell\" $id>{$this->data[$date->format("m/d/Y")]}";//.$attendancedata->getHTML($date->format("m/d/Y")); 
                        }else{
                            $html[] = "<td class=\"datacell\" $id>&nbsp;";
                        }
                    }
                }
                $html[] = "</td>";
            }
            $html[] = "</tr>";
        }
        $html[] = "{$this->newline}</tbody>";
        $html[] = "{$this->newline}</table>";
        //var_dump($html);;
        //echo "<br>";
        return implode($this->newline, $html);
    }
}

?>
