import duckdb, sys, time
t = time.time()
con = duckdb.connect()
con.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
rel = '2026-11-18.0'
q = f"""
COPY (
  SELECT id, height, num_floors, num_floors_underground, roof_shape, roof_height, class, subtype,
         sources[1].dataset AS src, ST_AsText(geometry) AS wkt
  FROM read_parquet('s3://overturemaps-us-west-2/release/{rel}/theme=buildings/type=building/*', filename=false, hive_partitioning=1)
  WHERE bbox.xmin > -58.7445 AND bbox.xmax < -58.6930 AND bbox.ymin > -34.5583 AND bbox.ymax < -34.5153
) TO 'tools/raw/sm-overture.csv' (HEADER, DELIMITER ',');
"""
con.execute(q)
print('ok', round(time.time() - t), 's')
