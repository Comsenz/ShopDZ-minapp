import { promisify } from '../../utils/promise.util'
import { $init, $digest } from '../../utils/common.util'

const wxUploadFile = promisify(wx.uploadFile)
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  data: {
    titleCount: 0,
    contentCount: 0,
    cause:null,
    title: '',
    order_amount:null,
    goods_amount:null,
    order_sn: null,
    rec_id:null,
    goods_num:0,
    content: '',
    causes_id:null,
    causes:null,
    goods_image: null,
    goods_name: null,
    // 使用data数据对象设置样式名
    minusStatus: 'disabled',
    images: [],
    num:0,
  },
  onLoad(options) {
    var self = this;
    var order_sn = options.order_sn;
    // var order_sn = '201904121003317600';
    var rec_id = options.rec_id;
    // var rec_id = '167';
    self.cause();
    self.dataList(order_sn, rec_id);
    $init(this)
  },
  handleTitleInput(e) {
    const value = e.detail.value
    this.data.title = value
    this.data.titleCount = value.length
    $digest(this)
  },

  handleContentInput(e) {
    const value = e.detail.value
    this.data.content = value
    this.data.contentCount = value.length
    $digest(this)
  },
  chooseImage(e) {
    var slef = this;
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        var tempFilePaths = res.tempFilePaths;  
        var uploadImgCount = 0;
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempFilePaths[0],
          encoding:'base64',
          success:function(data){
            var img = data.data;
            slef.refundimg(img);
          }
        }); 
        $digest(this)
      }
    })
  },
  refundimg:function(img){
    var self = this;
    var base64_string = img;
    var key = wx.getStorageSync('key');
    var data ={
      type:'refund',
      key:key,
      base64_string: base64_string
    }
      wx.request({
        url: curl +'api.php/Presales/refundimg',
        data:data,
        method:'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success:function(res){
          if(res.data.code ==0){
            var url = res.data.data.url;
            var images = self.data.images.concat(url)
            if (images.length <= 3){
              self.setData({
                images: images
              });
            }else{
              wx.showToast({
                title: '不能过于三张',
                icon: 'success',
                duration: 2000
              });
            }
          }
        }
      })
  },
  //删除图片
  removeImage(e) {
    const idx = e.target.dataset.idx

    if (idx == 2) {
      var img = this.data.images;
      img.pop();
      this.setData({
        images: img,
      })
    }

    if(this.data.images.length==1){
      this.setData({
        images:[],
      })
    }else{
      this.data.images.splice(idx, 1)
    }
    $digest(this)
  },
  //获取退款原因
  cause:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/presales/cause?key='+key,
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == 0){
          var reason = res.data.data;
          self.setData({
            cause: reason,
          })
        }
      }
    })
  },
  //下拉
  bindRegionChang: function (e) {
    var self = this;
    var causes_id = self.data.cause[e.detail.value].causes_id;
    var causes = self.data.cause[e.detail.value].causes_name;
    if (causes_id){
      self.setData({
        causes_id: causes_id,
        causes: causes,
      });
    }
  },
  dataList: function (id, rec_id){
    var self = this;
    var order_sn = id;
    var rec_id = rec_id;
    var key = wx.getStorageSync('key');
    // console.log(id,rec_id);
    wx.request({
      url: curl +'api.php/orders/getordergoods',
      data: { order_sn: order_sn, key: key, rec_id: rec_id},
      method:'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        console.log(res);
        if(res.data.code == 1){
          var order = res.data.data.goods_price * res.data.data.goods_num;
          var goods_amount = res.data.data.goods_price;
          var goods_image = res.data.data.goods_image;
          var goods_num = res.data.data.goods_num;
          var goods_name = res.data.data.goods_name;
          console.log(order);
          self.setData({
            order_amount: order,
            goods_image: goods_image,
            goods_name: goods_name,
            goods_num: goods_num,
            num: goods_num,
            order_sn: order_sn,
            goods_amount: goods_amount,
            rec_id: rec_id,
          })
        }
      }
    })
  },
  bindKeyName: function (e) {
    this.setData({
      order_amount: e.detail.value
    })
  },
  submitForm:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var order_sn = self.data.order_sn;
    var rec_id = self.data.rec_id;
    var return_goodsnum = self.data.num;
    var return_amount = self.data.order_amount;
    var goods_amount = self.data.goods_amount;
    var goods_num = self.data.goods_num;
    var causes = self.data.content;
    var img = self.data.images;
    var causes_id = self.data.causes_id;
    if (!causes_id) {
      wx.showToast({
        title: '退货原因不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退货原因不能为空');
      return;
    }
    if (goods_amount > return_amount){
      wx.showToast({
        title: '退款金额不能大于货物原价格',
        icon: 'none',
        duration: 2000
      });
      console.log('退款金额不能大于货物原价格');
      return;
    }
    if (!img.length>0) {
      wx.showToast({
        title: '退货凭证不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退货凭证不能为空');
      return;
    }
    if (!causes) {
      wx.showToast({
        title: '退货说明不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退货说明不能为空');
      return;
    }
    var test = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g;
    if (causes.match(test)) {
      wx.showToast({
        title: '不能使用emoji表情',
        icon: 'none',
      })
      return
    }
    if (goods_num > return_goodsnum){
      wx.showToast({
        title: '退货数量少于原货物数量',
        icon: 'none',
        duration: 2000
      });
      console.log('退货数量少于原货物数量');
      return;
    }
    
    var params_wx = {
      order_sn: order_sn,
      rec_id: rec_id,
      causes_id: causes_id,
      causes: causes,
      return_goodsnum: return_goodsnum,
      return_amount: return_amount,
      img1:img[0],
      img2:img[1],
      img3:img[2],
      key: key,
      type:1,
    };
    if (params_wx){
      wx.request({
        url: curl +'api.php/presales/returngood',
        data: params_wx,
        method:'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8' // 默认值
        },
        success:function(res){
          if(res.data.code ==1){
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 2000
            })
          }else{
            wx.showToast({
              title: res.data.msg,
              icon: 'success',
              duration: 2000
            })
            wx.navigateBack();
          }
        }
      })
    }
  },
  /* 点击减号 */
  bindMinus: function () {
    var num = this.data.num;
    if (num < this.data.goods_num) {
      wx.showToast({
        title: '退货数量已小于购买数量',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    // 如果大于1时，才可以减
    if (num > 1) {
      num--;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num <= 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function () {
    var num = this.data.num;
    if (num == this.data.goods_num || num > this.data.goods_num){
      wx.showToast({
        title: '退货数量已大于购买数量',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    // 不作过多考虑自增1
    num++;
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 输入框事件 */
  bindManual: function (e) {
    var num = e.detail.value;
    // 将数值与状态写回
    this.setData({
      num: num
    });
  },
})