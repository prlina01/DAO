// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name:string,
  description: string,
  image: string
}

// Base URI + TokenID
// Base URI = httpsL//example.com
// Token ID = 1

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const tokenId = req.query.tokenId;

  const image_url = 'https://raw.githubusercontent.com/prlina01/DAO/master/public/nfts/'

  res.status(200).json({
    name: "Crypto Dev #" + tokenId,
    description: "This token is really cool",
    image: image_url + tokenId + ".svg",
  });
}
