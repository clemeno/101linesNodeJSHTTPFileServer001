var http = require( 'http' ),
  url = require( 'url' ),
  fs = require( 'fs' ),
  mime = require( 'mime' ), // ____________________________________________________________ npm install --save mime ___
  path = require( 'path' ), // ____________________________________________________________ npm install --save path ___
  port = ( process.argv[ 2 ] || 8888 );
http.createServer( function( request, response ) { // ================================================= HTTP SERVER ===
  var method = ( '' + request.method ).toUpperCase(),
    file_name = url.parse( request.url ).pathname.replace( new RegExp( '[\\\/]+', 'g' ), '' ),
    file_path = path.join( process.cwd(), 'filebucket', file_name ); // .............................. require path ...
  if ( method === 'GET' ) { // ----------------------------------------------------------------------- GET requests ---
    fs.exists( file_path, function( bFileExists ) {
      if ( bFileExists ) { // ################################################################# send file to client ###
        fs.readFile( file_path, 'binary', function( err, file ) {
          if ( !err ) {
            response.writeHead( 200, {
              'Content-Type': mime.lookup( file_path ), // ........................................... require mime ...
              'Content-Description': 'GET File',
              'Content-Disposition': 'attachment; file_name=' + encodeURIComponent( file_name ),
              'Content-Transfer-Encoding': 'binary',
              'Connection': 'Keep-Alive',
              'Expires': 0,
              'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
              'Pragma': 'public',
              'Content-Length': fs.statSync( file_path ).size
            } );
            response.write( file, 'binary' );
            response.end()
          } else { // ********************************************************************** server can't read file ***
            response.writeHead( 500, {
              'Content-Type': 'application/json'
            } );
            response.write( JSON.stringify( {
              code: 500,
              details: err,
              file: file_name
            } ) );
            response.end()
          }
        } )
      } else { // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! file not found !!!
        response.writeHead( 404, {
          'Content-Type': 'application/json'
        } );
        response.write( JSON.stringify( {
          code: 404,
          details: 'File Not Found',
          file: file_name
        } ) );
        response.end()
      }
    } )
  } else if ( method === 'PUT' ) { // ---------------------------------------------------------------- PUT requests ---
    fs.exists( file_path, function( bFileExists ) {
      var file_write_stream = fs.createWriteStream( file_path );
      file_write_stream.once( 'open', function( file_descriptor ) {
        request.on( 'data', function( data ) {
          file_write_stream.write( data, function( err ) {
            if ( err ) { // *************************************************************** server can't write file ***
              file_write_stream.end();
              response.writeHead( 500, {
                'Content-Type': 'application/json'
              } );
              response.write( JSON.stringify( {
                code: 500,
                details: err,
                file: file_name
              } ) );
              response.end()
            }
          } )
        } );
        request.on( 'end', function() {
          file_write_stream.end();
          if ( bFileExists ) { // ############################################################ Resource Overwritten ###
            response.writeHead( 200, {
              'Content-Type': 'application/json'
            } );
            response.write( JSON.stringify( {
              code: 200,
              details: 'File Overwritten',
              file: file_name
            } ) );
            response.end()
          } else { // ############################################################################ Resource Created ###
            response.writeHead( 201, {
              'Content-Type': 'application/json'
            } );
            response.write( JSON.stringify( {
              code: 201,
              details: 'File Created',
              file: file_name
            } ) );
            response.end()
          }
        } )
      } )
    } )
  }
} ).listen( parseInt( port, 10 ) ); // ================================================================================
console.log( 'Test NodeJS HTTP File-Server running at http://localhost:' + port + '/' )