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

  const name = `Crypto Dev #${tokenId}`
  const description = 'This token is coooool!'
  const image=`https://raw.githubusercontent.com/prlina01/DAO/master/public/nfts/${Number(tokenId) - 1}.svg`

  return res.json({
    name, description, image
  })
}
