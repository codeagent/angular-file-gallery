<?php
include_once('IQuery.php');

class Model implements IQuery
{
  protected $where = [];
  protected $limit;
  protected $offset;
  protected $data;
  protected $total;

  public function __construct($json = 'data.json')
  {
    $this->data = json_decode(file_get_contents($json), true);
    $this->total = count($this->data);
  }

  public function limit($limit)
  {
    $this->limit = $limit;
    return $this;
  }

  public function offset($offset)
  {
    $this->offset = $offset;
    return $this;
  }

	public function where($where)
	{
    $this->where = $where;
    return $this;
	}

  public function all()
  {
    $filter = array_filter($this->where);
    $data = array_filter($this->data, function($row) use($filter) {

      $is = true;
      foreach($filter as $attribute => $value)
        $is = $is && (strpos($row[$attribute], $value) !== false);

      return $is;
    });

    $this->total = count($data);


    return array_slice($data, $this->offset, $this->limit);
  }

  public function count()
  {
    return $this->total;
  }
}
