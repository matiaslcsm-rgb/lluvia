import duckdb, json, time
t = time.time()
A = json.load(open('tools/fetch/area.json'))
con = duckdb.connect()
con.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
rel = '2026-11-18.0'
q = f"""
COPY (
  SELECT id, height, num_floors, num_floors_underground, roof_shape, roof_height, class, subtype,
         sources[1].dataset AS src, ST_AsText(geometry) AS wkt
  FROM read_parquet('s3://overturemaps-us-west-2/release/{rel}/theme=buildings/type=building/*', filename=false, hive_partitioning=1)
  WHERE bbox.xmin > {A['west']} AND bbox.xmax < {A['east']} AND bbox.ymin > {A['south']} AND bbox.ymax < {A['north']}
) TO 'tools/raw/sm-overture.csv' (HEADER, DELIMITER ',');
"""
con.execute(q)
print('ok', con.execute("select count(*) from read_csv('tools/raw/sm-overture.csv')").fetchone()[0], 'edificios', round(time.time() - t), 's')
